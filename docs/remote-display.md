# OpenStage Remote Display Relay

Phase 1 Remote Display uses a small WebSocket relay on the Raspberry Pi. Render remains a static site. The iPad controller and the Raspberry Pi `/display` browser page both connect directly to the Pi relay over the local network.

## Plain Local Relay

Use this when OpenStage is also loaded over `http://` on the local network:

```bash
npm run remote-display
```

Default address:

```text
ws://PI-IP:8787
```

## Secure Local Relay

Use this when OpenStage is loaded from Render over `https://`. Browsers block `ws://` from an HTTPS page, so the relay must use `wss://`.

### 1. Generate a local self-signed certificate on the Pi

Replace `192.168.68.125` with the Raspberry Pi LAN IP address.

```bash
mkdir -p certs

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/openstage-remote.key \
  -out certs/openstage-remote.crt \
  -days 825 \
  -subj "/CN=192.168.68.125" \
  -addext "subjectAltName=IP:192.168.68.125,DNS:raspberrypi.local"
```

### 2. Start the secure relay

```bash
npm run remote-display-secure
```

Default address:

```text
wss://192.168.68.125:8788
```

## Dual Local Relay

Use this when one device loads OpenStage locally over `http://` and another loads OpenStage from Render over `https://`.

This starts one relay process with two listeners:

```text
ws://0.0.0.0:8787
wss://0.0.0.0:8788
```

Both listeners share the same client set and message broadcast bus.

```bash
npm run remote-display-dual
```

Example setup:

```text
Pi /display page: ws://192.168.68.125:8787
iPad controller:  wss://192.168.68.125:8788
```

### 3. Trust the local certificate on the iPad

Because this is a self-signed local certificate, iPadOS may reject the secure WebSocket until the certificate is trusted.

One practical test path:

1. Open `https://192.168.68.125:8788/health` in Safari on the iPad.
2. If Safari shows a certificate warning, choose the option to continue to the site.
3. If iPadOS requires installed trust instead, AirDrop/email the `certs/openstage-remote.crt` file to the iPad, install the profile, then enable full trust in Settings > General > About > Certificate Trust Settings.
4. In OpenStage Settings, set Remote Display relay address to `wss://192.168.68.125:8788`.
5. On the Pi display page, set the same relay address.

## Custom Certificate Paths

The secure relay defaults to:

```text
certs/openstage-remote.crt
certs/openstage-remote.key
```

To use different files:

```bash
OPENSTAGE_REMOTE_DISPLAY_SECURE=1 \
OPENSTAGE_REMOTE_DISPLAY_PORT=8788 \
OPENSTAGE_REMOTE_DISPLAY_CERT=/path/to/cert.crt \
OPENSTAGE_REMOTE_DISPLAY_KEY=/path/to/key.key \
node ./scripts/remote-display-server.mjs
```

## Success Test

1. Pi runs `npm run remote-display-dual`.
2. Pi opens local Vite `/display` and uses `ws://192.168.68.125:8787`.
3. iPad opens the Render OpenStage URL and uses `wss://192.168.68.125:8788`.
4. Both show connected.
5. Selecting a song on iPad updates the Pi display.

This does not add cloud sync, Supabase, authentication, or song-file synchronization. The relay only forwards small control messages such as:

```json
{ "type": "song", "songId": "abc123" }
```
