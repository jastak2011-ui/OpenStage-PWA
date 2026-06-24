import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createSecureServer } from 'node:https';

const secureMode = process.env.OPENSTAGE_REMOTE_DISPLAY_SECURE === '1';
const dualMode = process.env.OPENSTAGE_REMOTE_DISPLAY_DUAL === '1';
const plainPort = Number(process.env.OPENSTAGE_REMOTE_DISPLAY_WS_PORT || 8787);
const securePort = Number(process.env.OPENSTAGE_REMOTE_DISPLAY_WSS_PORT || 8788);
const port = Number(process.env.OPENSTAGE_REMOTE_DISPLAY_PORT || process.env.PORT || (secureMode ? securePort : plainPort));
const certPath = process.env.OPENSTAGE_REMOTE_DISPLAY_CERT || './certs/openstage-remote.crt';
const keyPath = process.env.OPENSTAGE_REMOTE_DISPLAY_KEY || './certs/openstage-remote.key';
const clients = new Set();

const requestHandler = (mode) => (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, mode, clients: clients.size }));
    return;
  }

  response.writeHead(200, { 'content-type': 'text/plain' });
  response.end(`OpenStage Remote Display ${mode} WebSocket relay is running.\n`);
};

if ((secureMode || dualMode) && (!existsSync(certPath) || !existsSync(keyPath))) {
  console.error('OpenStage Remote Display secure relay could not start.');
  console.error(`Missing certificate or key file.`);
  console.error(`Expected certificate: ${certPath}`);
  console.error(`Expected key: ${keyPath}`);
  console.error('Generate them on the Raspberry Pi first. See docs/remote-display.md.');
  process.exit(1);
}

if (dualMode) {
  const plainServer = createPlainRelayServer();
  const secureServer = createSecureRelayServer();
  listen(plainServer, plainPort, 'ws');
  listen(secureServer, securePort, 'wss');
} else {
  const server = secureMode ? createSecureRelayServer() : createPlainRelayServer();
  listen(server, port, secureMode ? 'wss' : 'ws');
}

function createPlainRelayServer() {
  const server = createServer(requestHandler('plain'));
  attachWebSocketRelay(server);
  return server;
}

function createSecureRelayServer() {
  const server = createSecureServer(
    {
      cert: readFileSync(certPath),
      key: readFileSync(keyPath)
    },
    requestHandler('secure')
  );
  attachWebSocketRelay(server);
  return server;
}

function attachWebSocketRelay(server) {
  server.on('upgrade', (request, socket) => {
    const key = request.headers['sec-websocket-key'];
    if (!key || typeof key !== 'string') {
      socket.destroy();
      return;
    }

    const accept = createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '',
      ''
    ].join('\r\n'));

    clients.add(socket);
    socket.on('data', (buffer) => {
      const message = decodeClientFrame(buffer);
      if (!message) return;
      broadcast(message, socket);
    });
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });
}

function listen(server, serverPort, scheme) {
  server.listen(serverPort, '0.0.0.0', () => {
    console.log(`OpenStage Remote Display relay listening on ${scheme}://0.0.0.0:${serverPort}`);
    if (scheme === 'wss') console.log(`Using certificate ${certPath} and key ${keyPath}`);
  });
}

function broadcast(message, source) {
  const frame = encodeTextFrame(message);
  for (const client of clients) {
    if (client === source || client.destroyed) continue;
    client.write(frame);
  }
}

function decodeClientFrame(buffer) {
  if (buffer.length < 6) return null;
  const opcode = buffer[0] & 0x0f;
  if (opcode === 0x8) return null;
  if (opcode !== 0x1) return null;

  const masked = (buffer[1] & 0x80) === 0x80;
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < offset + 2) return null;
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) return null;
    const high = buffer.readUInt32BE(offset);
    const low = buffer.readUInt32BE(offset + 4);
    if (high !== 0) return null;
    length = low;
    offset += 8;
  }

  if (!masked || buffer.length < offset + 4 + length) return null;
  const mask = buffer.subarray(offset, offset + 4);
  offset += 4;

  const payload = Buffer.alloc(length);
  for (let index = 0; index < length; index += 1) {
    payload[index] = buffer[offset + index] ^ mask[index % 4];
  }

  return payload.toString('utf8');
}

function encodeTextFrame(message) {
  const payload = Buffer.from(message, 'utf8');
  const length = payload.length;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }

  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeUInt32BE(0, 2);
  header.writeUInt32BE(length, 6);
  return Buffer.concat([header, payload]);
}
