import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { lookupMusicBrainzChartSourceLinks, searchMusicBrainzRecordings } from './musicbrainz.js';
import { resolveSongsterrSong } from './songsterr.js';
import { requireAuthenticatedAdmin, requireAuthenticatedUser } from './auth.js';
import {
  assertPendingInvitation,
  createInviteToken,
  createInviteUrl,
  getInvitationStatus,
  hashInviteToken,
  inviteTtlMs,
  inviteTokenMatches,
  isValidAdminEmail,
  normalizeAdminEmail,
  normalizeOpenStageRole,
  publicInvitation,
  publicProfile
} from './admin.js';

const app = express();
const port = Number(process.env.PORT) || 10000;
const defaultPrompt = 'Say hello from OpenStage';
const defaultAnthropicModel = 'claude-sonnet-4-6';
const shareTtlMs = 7 * 24 * 60 * 60 * 1000;
const roomTtlMs = 12 * 60 * 60 * 1000;
const roomCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const shareCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const openStageFrontendBaseUrl = 'https://openstage-pwa.onrender.com';

const allowedOrigins = new Set([
  'https://openstage-pwa.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

function getAnthropicErrorDetails(error, context = 'Anthropic request') {
  const status = error?.status;
  const type = error?.error?.type || error?.type;
  const message = error?.message;
  const responseBody = error?.error || error?.response?.data || error?.response?.body;

  console.error(`${context} failed:`, {
    status,
    message,
    type,
    responseBody
  });

  if (status === 401 || type === 'authentication_error') return 'authentication_error';
  if (status === 402 || type === 'billing_error' || /credit|billing|payment/i.test(message || '')) return 'billing_error';
  if (status === 400 && /model/i.test(message || '')) return 'model_error';
  if (type === 'invalid_request_error' && /model/i.test(message || '')) return 'model_error';
  return 'unknown_error';
}

function getAnthropicText(message) {
  return message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function parseClaudeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude response did not include JSON.');
    return JSON.parse(match[0]);
  }
}

function normalizeImportedSong(song, fallback) {
  return {
    title: fallback.title,
    artist: fallback.artist,
    key: typeof song?.key === 'string' ? song.key.trim() : '',
    capo: Number.isFinite(Number(song?.capo)) ? Math.max(0, Math.round(Number(song.capo))) : 0,
    bpm: Number.isFinite(Number(song?.bpm)) && Number(song.bpm) > 0 ? Math.round(Number(song.bpm)) : null,
    chart: typeof song?.chart === 'string' ? song.chart : ''
  };
}

function createShareId() {
  const bytes = randomBytes(5);
  return Array.from(bytes, (byte) => shareCodeAlphabet[byte % shareCodeAlphabet.length]).join('');
}

function createRoomCode() {
  const bytes = randomBytes(4);
  return Array.from(bytes, (byte) => roomCodeAlphabet[byte % roomCodeAlphabet.length]).join('');
}

function normalizeSharedSong(song) {
  return {
    ...song,
    songUuid: typeof song?.songUuid === 'string' ? song.songUuid.trim() : '',
    version: Number.isFinite(Number(song?.version)) && Number(song.version) > 0 ? Math.floor(Number(song.version)) : 1,
    title: typeof song?.title === 'string' ? song.title.trim() : '',
    artist: typeof song?.artist === 'string' ? song.artist.trim() : '',
    subtitle: typeof song?.subtitle === 'string' ? song.subtitle.trim() : '',
    album: typeof song?.album === 'string' ? song.album.trim() : '',
    key: typeof song?.key === 'string' ? song.key.trim() : '',
    capo: Number.isFinite(Number(song?.capo)) ? Math.max(0, Math.round(Number(song.capo))) : 0,
    bpm: Number.isFinite(Number(song?.bpm)) && Number(song.bpm) > 0 ? Math.round(Number(song.bpm)) : null,
    timeSignature: typeof song?.timeSignature === 'string' ? song.timeSignature.trim() : '',
    chart: typeof song?.chart === 'string' ? song.chart : '',
    rawChordPro: typeof song?.rawChordPro === 'string' ? song.rawChordPro : typeof song?.chart === 'string' ? song.chart : '',
    notes: typeof song?.notes === 'string' ? song.notes : '',
    bandNotes: typeof song?.bandNotes === 'string' ? song.bandNotes : '',
    referenceAudioUrl: typeof song?.referenceAudioUrl === 'string' ? song.referenceAudioUrl.trim() : '',
    lastSharedAt: typeof song?.lastSharedAt === 'string' ? song.lastSharedAt : '',
    favorite: Boolean(song?.favorite)
  };
}

function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase is not configured.');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

const requireCloudUser = requireAuthenticatedUser(createSupabaseClient);
const requireCloudAdmin = requireAuthenticatedAdmin(createSupabaseClient);

function logSupabaseError(context, error, extra = {}) {
  console.error(`${context}:`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    ...extra
  });
}

async function insertSharedSong(supabase, song, expiresAt) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareCode = createShareId();
    const { data, error } = await supabase
      .from('shared_songs')
      .insert({
        share_code: shareCode,
        song_json: song,
        expires_at: expiresAt.toISOString()
      })
      .select('share_code')
      .single();

    if (!error) return data.share_code;

    lastError = error;
    if (error.code !== '23505') break;
  }

  throw lastError || new Error('Failed to create shared song.');
}

async function getTableCount(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

async function sendSupabaseInviteEmail(supabase, email, token) {
  const redirectTo = createInviteUrl(openStageFrontendBaseUrl, token);
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo
  });
  if (error) throw error;
}

async function activeEnabledAdminCount(supabase) {
  const { count, error } = await supabase
    .from('openstage_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('disabled', false);

  if (error) throw error;
  return count ?? 0;
}

async function findInvitationByToken(supabase, token) {
  const tokenHash = hashInviteToken(token);
  const { data, error } = await supabase
    .from('openstage_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!data || !inviteTokenMatches(token, data.token_hash)) return null;
  return data;
}

async function insertRehearsalRoom(supabase, roomName, expiresAt) {
  let lastError;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = createRoomCode();
    const { data, error } = await supabase
      .from('rehearsal_rooms')
      .insert({
        room_code: roomCode,
        room_name: roomName,
        expires_at: expiresAt.toISOString()
      })
      .select('id, room_code, room_name, expires_at')
      .single();

    if (!error) return data;

    lastError = error;
    if (error.code !== '23505') break;
  }

  throw lastError || new Error('Failed to create rehearsal room.');
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'openstage-api'
  });
});

app.get('/anthropic-status', (_request, response) => {
  response.json({
    configured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
});

app.get('/supabase-status', (_request, response) => {
  response.json({
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
  });
});

app.get('/supabase-test', async (_request, response) => {
  try {
    const supabase = createSupabaseClient();
    const count = await getTableCount(supabase, 'shared_songs');

    response.json({
      ok: true,
      count
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Supabase test failed', error);
    response.status(500).json({
      ok: false,
      error: 'Supabase test failed.'
    });
  }
});

app.get('/api/room-status', async (_request, response) => {
  try {
    const supabase = createSupabaseClient();
    const [rooms, members, events] = await Promise.all([
      getTableCount(supabase, 'rehearsal_rooms'),
      getTableCount(supabase, 'rehearsal_room_members'),
      getTableCount(supabase, 'rehearsal_room_events')
    ]);

    response.json({
      ok: true,
      rooms,
      members,
      events
    });
  } catch (error) {
    logSupabaseError('Room status check failed', error);
    response.status(500).json({
      ok: false,
      error: 'Room status check failed.'
    });
  }
});

app.get('/api/sync-status', async (_request, response) => {
  try {
    const supabase = createSupabaseClient();
    const [songs, setlists] = await Promise.all([
      getTableCount(supabase, 'user_songs'),
      getTableCount(supabase, 'user_setlists')
    ]);

    response.json({
      ok: true,
      songs,
      setlists
    });
  } catch (error) {
    logSupabaseError('Cloud sync status check failed', error);
    response.status(500).json({
      ok: false,
      error: 'Cloud sync status check failed.'
    });
  }
});

app.get('/api/admin/overview', requireCloudAdmin, async (_request, response) => {
  try {
    const supabase = createSupabaseClient();
    const [inviteResult, profileResult] = await Promise.all([
      supabase
        .from('openstage_invitations')
        .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('openstage_profiles')
        .select('user_id, email, display_name, role, disabled, created_at, updated_at')
        .order('email', { ascending: true })
    ]);

    if (inviteResult.error) throw inviteResult.error;
    if (profileResult.error) throw profileResult.error;

    response.json({
      ok: true,
      invitations: (inviteResult.data || []).map((invite) => publicInvitation(invite)),
      users: (profileResult.data || []).map((profile) => publicProfile(profile))
    });
  } catch (error) {
    logSupabaseError('Admin overview failed', error);
    response.status(500).json({ ok: false, error: 'Admin overview failed.' });
  }
});

app.post('/api/admin/invitations', requireCloudAdmin, async (request, response) => {
  const email = normalizeAdminEmail(request.body?.email);
  const role = normalizeOpenStageRole(request.body?.role);

  if (!isValidAdminEmail(email)) {
    response.status(400).json({ ok: false, error: 'A valid email address is required.' });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const token = createInviteToken();
    const expiresAt = new Date(Date.now() + inviteTtlMs).toISOString();
    const now = new Date().toISOString();

    const { data: existingInvite, error: existingError } = await supabase
      .from('openstage_invitations')
      .select('*')
      .eq('email', email)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingInvite) {
      const existingStatus = getInvitationStatus(existingInvite);
      if (existingStatus === 'Pending') {
        response.status(409).json({
          ok: false,
          error: 'A pending invitation already exists for this email address.'
        });
        return;
      }

      const { data: refreshedInvite, error: refreshError } = await supabase
        .from('openstage_invitations')
        .update({
          role,
          token_hash: hashInviteToken(token),
          invited_by: request.authAdmin.id,
          expires_at: expiresAt,
          last_sent_at: now,
          revoked_at: null,
          accepted_at: null
        })
        .eq('id', existingInvite.id)
        .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
        .single();

      if (refreshError) throw refreshError;

      let refreshedEmailSent = true;
      try {
        await sendSupabaseInviteEmail(supabase, email, token);
      } catch (inviteEmailError) {
        refreshedEmailSent = false;
        logSupabaseError('Supabase invite email failed', inviteEmailError, { email });
      }

      response.json({
        ok: true,
        invitation: publicInvitation(refreshedInvite),
        inviteUrl: createInviteUrl(openStageFrontendBaseUrl, token),
        emailSent: refreshedEmailSent
      });
      return;
    }

    const { data, error } = await supabase
      .from('openstage_invitations')
      .insert({
        email,
        role,
        token_hash: hashInviteToken(token),
        invited_by: request.authAdmin.id,
        expires_at: expiresAt,
        last_sent_at: now
      })
      .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
      .single();

    if (error) throw error;

    let emailSent = true;
    try {
      await sendSupabaseInviteEmail(supabase, email, token);
    } catch (inviteEmailError) {
      emailSent = false;
      logSupabaseError('Supabase invite email failed', inviteEmailError, { email });
    }

    response.json({
      ok: true,
      invitation: publicInvitation(data),
      inviteUrl: createInviteUrl(openStageFrontendBaseUrl, token),
      emailSent
    });
  } catch (error) {
    logSupabaseError('Create invitation failed', error, { email, role });
    response.status(500).json({ ok: false, error: 'Could not create invitation.' });
  }
});

async function rotateInvitationToken(request, response, { sendEmail }) {
  const invitationId = request.params.id;

  try {
    const supabase = createSupabaseClient();
    const { data: invitation, error: fetchError } = await supabase
      .from('openstage_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;
    assertPendingInvitation(invitation);

    const token = createInviteToken();
    const expiresAt = new Date(Date.now() + inviteTtlMs).toISOString();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('openstage_invitations')
      .update({
        token_hash: hashInviteToken(token),
        expires_at: expiresAt,
        last_sent_at: now
      })
      .eq('id', invitationId)
      .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
      .single();

    if (error) throw error;

    let emailSent = false;
    if (sendEmail) {
      try {
        await sendSupabaseInviteEmail(supabase, invitation.email, token);
        emailSent = true;
      } catch (inviteEmailError) {
        logSupabaseError('Supabase invite resend failed', inviteEmailError, { invitationId });
      }
    }

    response.json({
      ok: true,
      invitation: publicInvitation(data),
      inviteUrl: createInviteUrl(openStageFrontendBaseUrl, token),
      emailSent
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 500) logSupabaseError('Rotate invitation token failed', error, { invitationId });
    response.status(status).json({
      ok: false,
      error: status === 400 ? error.message : 'Could not update invitation.'
    });
  }
}

app.post('/api/admin/invitations/:id/link', requireCloudAdmin, (request, response) =>
  rotateInvitationToken(request, response, { sendEmail: false })
);

app.post('/api/admin/invitations/:id/resend', requireCloudAdmin, (request, response) =>
  rotateInvitationToken(request, response, { sendEmail: true })
);

app.post('/api/admin/invitations/:id/revoke', requireCloudAdmin, async (request, response) => {
  const invitationId = request.params.id;

  try {
    const supabase = createSupabaseClient();
    const { data: invitation, error: fetchError } = await supabase
      .from('openstage_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;
    assertPendingInvitation(invitation);

    const { data, error } = await supabase
      .from('openstage_invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', invitationId)
      .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
      .single();

    if (error) throw error;
    response.json({ ok: true, invitation: publicInvitation(data) });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 500) logSupabaseError('Revoke invitation failed', error, { invitationId });
    response.status(status).json({
      ok: false,
      error: status === 400 ? error.message : 'Could not revoke invitation.'
    });
  }
});

app.patch('/api/admin/users/:userId', requireCloudAdmin, async (request, response) => {
  const targetUserId = request.params.userId;
  const nextRole = request.body?.role === undefined ? undefined : normalizeOpenStageRole(request.body.role);
  const nextDisabled = request.body?.disabled === undefined ? undefined : Boolean(request.body.disabled);

  if (nextRole === undefined && nextDisabled === undefined) {
    response.status(400).json({ ok: false, error: 'No user update was provided.' });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const { data: currentProfile, error: currentError } = await supabase
      .from('openstage_profiles')
      .select('user_id, email, display_name, role, disabled, created_at, updated_at')
      .eq('user_id', targetUserId)
      .single();

    if (currentError) throw currentError;

    const enabledAdminCount = await activeEnabledAdminCount(supabase);
    const wouldRemoveEnabledAdmin =
      currentProfile.role === 'admin' &&
      currentProfile.disabled === false &&
      ((nextRole && nextRole !== 'admin') || nextDisabled === true);

    if (wouldRemoveEnabledAdmin && enabledAdminCount <= 1) {
      response.status(400).json({
        ok: false,
        error: 'At least one enabled admin must remain.'
      });
      return;
    }

    const patch = { updated_at: new Date().toISOString() };
    if (nextRole !== undefined) patch.role = nextRole;
    if (nextDisabled !== undefined) patch.disabled = nextDisabled;

    const { data, error } = await supabase
      .from('openstage_profiles')
      .update(patch)
      .eq('user_id', targetUserId)
      .select('user_id, email, display_name, role, disabled, created_at, updated_at')
      .single();

    if (error) throw error;
    response.json({ ok: true, user: publicProfile(data) });
  } catch (error) {
    logSupabaseError('Admin user update failed', error, { targetUserId });
    response.status(500).json({ ok: false, error: 'Could not update user.' });
  }
});

app.get('/api/invitations/validate', async (request, response) => {
  const token = typeof request.query?.token === 'string' ? request.query.token : '';
  if (!token) {
    response.status(400).json({ ok: false, error: 'Invitation token is required.' });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const invitation = await findInvitationByToken(supabase, token);
    if (!invitation) {
      response.status(404).json({ ok: false, error: 'Invitation not found.' });
      return;
    }

    const status = getInvitationStatus(invitation);
    if (status !== 'Pending') {
      response.status(400).json({ ok: false, error: `Invitation is ${status.toLowerCase()}.`, status });
      return;
    }

    response.json({
      ok: true,
      invitation: {
        email: invitation.email,
        role: normalizeOpenStageRole(invitation.role),
        expiresAt: invitation.expires_at,
        status
      }
    });
  } catch (error) {
    logSupabaseError('Validate invitation failed', error);
    response.status(500).json({ ok: false, error: 'Could not validate invitation.' });
  }
});

app.post('/api/invitations/accept', requireCloudUser, async (request, response) => {
  const token = typeof request.body?.token === 'string' ? request.body.token : '';
  if (!token) {
    response.status(400).json({ ok: false, error: 'Invitation token is required.' });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const invitation = await findInvitationByToken(supabase, token);
    if (!invitation) {
      response.status(404).json({ ok: false, error: 'Invitation not found.' });
      return;
    }
    assertPendingInvitation(invitation);

    const authEmail = normalizeAdminEmail(request.authUser.email);
    if (authEmail !== invitation.email) {
      response.status(403).json({ ok: false, error: 'Sign in with the invited email address to accept this invitation.' });
      return;
    }

    const now = new Date().toISOString();
    const { data: profile, error: profileError } = await supabase
      .from('openstage_profiles')
      .upsert(
        {
          user_id: request.authUser.id,
          email: invitation.email,
          role: normalizeOpenStageRole(invitation.role),
          disabled: false,
          updated_at: now
        },
        { onConflict: 'user_id' }
      )
      .select('user_id, email, display_name, role, disabled, created_at, updated_at')
      .single();

    if (profileError) throw profileError;

    const { data: updatedInvite, error: inviteError } = await supabase
      .from('openstage_invitations')
      .update({ accepted_at: now })
      .eq('id', invitation.id)
      .select('id, email, role, invited_by, created_at, expires_at, accepted_at, revoked_at, last_sent_at')
      .single();

    if (inviteError) throw inviteError;

    response.json({
      ok: true,
      profile: publicProfile(profile),
      invitation: publicInvitation(updatedInvite)
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 500) logSupabaseError('Accept invitation failed', error);
    response.status(status).json({
      ok: false,
      error: status === 400 ? error.message : 'Could not accept invitation.'
    });
  }
});

app.get('/api/sync/library', requireCloudUser, async (request, response) => {
  const userId = request.authUser.id;
  const includeFull = request.query?.includeFull === 'true';

  try {
    const supabase = createSupabaseClient();
    const [songResult, setlistResult] = await Promise.all([
      supabase
        .from('user_songs')
        .select('song_uuid, song_json, revision, updated_at')
        .eq('user_id', userId),
      supabase
        .from('user_setlists')
        .select('setlist_uuid, setlist_json, updated_at')
        .eq('user_id', userId)
    ]);

    if (songResult.error) throw songResult.error;
    if (setlistResult.error) throw setlistResult.error;

    const songs = (songResult.data || [])
      .map((row) => ({
        songUuid: row.song_uuid,
        title: typeof row.song_json?.title === 'string' ? row.song_json.title : '',
        revision: Number.isFinite(Number(row.revision)) ? Number(row.revision) : 1,
        updatedAt: row.updated_at,
        ...(includeFull ? { song: row.song_json } : {})
      }))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    const setlists = (setlistResult.data || [])
      .map((row) => ({
        setlistUuid: row.setlist_uuid,
        name: typeof row.setlist_json?.name === 'string'
          ? row.setlist_json.name
          : typeof row.setlist_json?.title === 'string'
            ? row.setlist_json.title
            : '',
        updatedAt: row.updated_at,
        ...(includeFull ? { setlist: row.setlist_json } : {})
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    response.json({
      ok: true,
      songs,
      setlists
    });
  } catch (error) {
    logSupabaseError('Cloud library verification failed', error);
    response.status(500).json({
      ok: false,
      error: 'Cloud library verification failed.'
    });
  }
});

app.post('/api/sync/song', requireCloudUser, async (request, response) => {
  const userId = request.authUser.id;
  const song = request.body?.song && typeof request.body.song === 'object' ? request.body.song : null;
  const songUuid = typeof song?.songUuid === 'string' ? song.songUuid.trim() : '';
  const title = typeof song?.title === 'string' ? song.title.trim() : '';

  if (!song || !songUuid || !title) {
    response.status(400).json({
      ok: false,
      error: 'song, song.songUuid, and song.title are required.'
    });
    return;
  }

  const revision = Number.isFinite(Number(song.version))
    ? Math.max(1, Math.floor(Number(song.version)))
    : Number.isFinite(Number(song.revision))
      ? Math.max(1, Math.floor(Number(song.revision)))
      : 1;

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('user_songs')
      .upsert(
        {
          user_id: userId,
          song_uuid: songUuid,
          song_json: song,
          revision,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,song_uuid'
        }
      );

    if (error) throw error;

    response.json({
      ok: true,
      songUuid,
      revision
    });
  } catch (error) {
    logSupabaseError('Song sync failed', error, {
      userId,
      songUuid,
      title
    });
    response.status(500).json({
      ok: false,
      error: 'Song sync failed.'
    });
  }
});

app.post('/api/sync/setlist', requireCloudUser, async (request, response) => {
  const userId = request.authUser.id;
  const setlist = request.body?.setlist && typeof request.body.setlist === 'object' ? request.body.setlist : null;
  const setlistUuid = typeof setlist?.setlistUuid === 'string' ? setlist.setlistUuid.trim() : '';
  const name = typeof setlist?.name === 'string' && setlist.name.trim()
    ? setlist.name.trim()
    : typeof setlist?.title === 'string'
      ? setlist.title.trim()
      : '';

  if (!setlist || !setlistUuid || !name) {
    response.status(400).json({
      ok: false,
      error: 'setlist, setlist.setlistUuid, and setlist.name or setlist.title are required.'
    });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from('user_setlists')
      .upsert(
        {
          user_id: userId,
          setlist_uuid: setlistUuid,
          setlist_json: setlist,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,setlist_uuid'
        }
      );

    if (error) throw error;

    response.json({
      ok: true,
      setlistUuid,
      name
    });
  } catch (error) {
    logSupabaseError('Setlist sync failed', error, {
      userId,
      setlistUuid,
      name
    });
    response.status(500).json({
      ok: false,
      error: 'Setlist sync failed.'
    });
  }
});

app.post('/api/rooms/create', async (request, response) => {
  const displayName = typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';
  const deviceId = typeof request.body?.deviceId === 'string' ? request.body.deviceId.trim() : '';
  const requestedRoomName = typeof request.body?.roomName === 'string' ? request.body.roomName.trim() : '';

  if (!displayName || !deviceId) {
    response.status(400).json({
      ok: false,
      error: 'Display name and device id are required.'
    });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const roomName = requestedRoomName || `${displayName}'s Room`;
    const expiresAt = new Date(Date.now() + roomTtlMs);
    const room = await insertRehearsalRoom(supabase, roomName, expiresAt);
    const { error: memberError } = await supabase
      .from('rehearsal_room_members')
      .insert({
        room_id: room.id,
        display_name: displayName,
        device_id: deviceId
      });

    if (memberError) throw memberError;

    console.log('Rehearsal room created:', {
      roomId: room.id,
      roomCode: room.room_code,
      roomName: room.room_name,
      displayName,
      expiresAt: room.expires_at
    });

    response.json({
      ok: true,
      room: {
        id: room.id,
        roomCode: room.room_code,
        roomName: room.room_name,
        expiresAt: room.expires_at
      }
    });
  } catch (error) {
    logSupabaseError('Room create failed', error, {
      displayName,
      deviceId
    });
    response.status(500).json({
      ok: false,
      error: 'Could not create room.'
    });
  }
});

app.post('/api/test-anthropic', async (request, response) => {
  const prompt = typeof request.body?.prompt === 'string' && request.body.prompt.trim()
    ? request.body.prompt.trim()
    : defaultPrompt;

  if (!process.env.ANTHROPIC_API_KEY) {
    response.status(500).json({
      ok: false,
      error: 'Anthropic API key is not configured.'
    });
    return;
  }

  try {
    const anthropicModel = process.env.ANTHROPIC_MODEL || defaultAnthropicModel;
    console.log('Anthropic model:', anthropicModel);
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    const message = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const text = getAnthropicText(message);

    response.json({
      ok: true,
      text
    });
  } catch (error) {
    const details = getAnthropicErrorDetails(error, 'Anthropic test');
    response.status(500).json({
      ok: false,
      error: 'Anthropic request failed.',
      details
    });
  }
});

app.post('/api/ai-import-song', async (request, response) => {
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';
  const artist = typeof request.body?.artist === 'string' ? request.body.artist.trim() : '';
  const key = typeof request.body?.key === 'string' ? request.body.key.trim() : '';
  const capo = request.body?.capo ?? '';

  if (!title) {
    response.status(400).json({
      ok: false,
      error: 'Title is required.'
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    response.status(500).json({
      ok: false,
      error: 'AI draft failed.'
    });
    return;
  }

  try {
    const anthropicModel = process.env.ANTHROPIC_MODEL || defaultAnthropicModel;
    console.log('Anthropic model:', anthropicModel);
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    const prompt = [
      'Return ONLY valid JSON for an OpenStage AI draft. Do not include markdown, explanations, or code fences.',
      'This is an unverified draft. Do not claim that the chart is authoritative or sourced from a published chart.',
      'The JSON object must use exactly these fields:',
      '{"title":"","artist":"","key":"","capo":0,"bpm":null,"chart":""}',
      'Chart requirements:',
      '- plain OpenStage-compatible chord chart',
      '- include sections like Intro:, Verse 1:, Chorus:',
      '- preserve chords-over-lyrics spacing',
      '- no markdown',
      '- no explanations',
      '- no code fences',
      '',
      `Song title: ${title}`,
      `Artist: ${artist || 'optional/unknown'}`,
      `Key: ${key || 'optional/unknown'}`,
      `Capo: ${capo === '' ? 'optional/unknown' : capo}`
    ].join('\n');
    const message = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const text = getAnthropicText(message);
    const song = normalizeImportedSong(parseClaudeJson(text), { title, artist });

    response.json({
      ok: true,
      song
    });
  } catch (error) {
    getAnthropicErrorDetails(error, 'AI draft');
    response.status(500).json({
      ok: false,
      error: 'AI draft failed.'
    });
  }
});

app.get('/api/song-search', async (request, response) => {
  const title = typeof request.query?.title === 'string' ? request.query.title.trim() : '';
  const artist = typeof request.query?.artist === 'string' ? request.query.artist.trim() : '';

  if (!title) {
    response.status(400).json({
      ok: false,
      error: 'Song title is required.'
    });
    return;
  }

  try {
    const results = await searchMusicBrainzRecordings({ title, artist });
    response.json({
      ok: true,
      results
    });
  } catch (error) {
    console.error('MusicBrainz song search failed:', {
      status: error?.status,
      message: error?.message
    });
    response.status(502).json({
      ok: false,
      error: 'Song search failed.'
    });
  }
});

app.get('/api/musicbrainz-source-links', async (request, response) => {
  const recordingMbid = typeof request.query?.recordingMbid === 'string' ? request.query.recordingMbid.trim() : '';

  if (!recordingMbid) {
    response.status(400).json({
      ok: false,
      error: 'Recording MBID is required.'
    });
    return;
  }

  try {
    const sources = await lookupMusicBrainzChartSourceLinks({ recordingMbid });
    response.json({
      ok: true,
      sources
    });
  } catch (error) {
    console.error('MusicBrainz source link lookup failed:', {
      status: error?.status,
      message: error?.message
    });
    response.status(502).json({
      ok: false,
      error: 'MusicBrainz source links failed.'
    });
  }
});

app.get('/api/songsterr-resolve', async (request, response) => {
  const title = typeof request.query?.title === 'string' ? request.query.title.trim() : '';
  const artist = typeof request.query?.artist === 'string' ? request.query.artist.trim() : '';

  if (!title || !artist) {
    response.status(400).json({
      ok: false,
      error: 'Song title and artist are required.'
    });
    return;
  }

  try {
    const result = await resolveSongsterrSong({ title, artist });
    response.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error('Songsterr resolve failed:', {
      status: error?.status,
      message: error?.message
    });
    response.status(error?.status === 400 ? 400 : 502).json({
      ok: false,
      error: 'Songsterr direct lookup failed.'
    });
  }
});

app.post('/api/share-song', async (request, response) => {
  const song = normalizeSharedSong(request.body?.song);

  if (!song.title || !song.chart) {
    response.status(400).json({
      ok: false,
      error: 'Song title and chart are required.'
    });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const expiresAt = new Date(Date.now() + shareTtlMs);
    const shareCode = await insertSharedSong(supabase, song, expiresAt);

    console.log('Shared song created:', {
      shareCode,
      title: song.title,
      artist: song.artist,
      expiresAt: expiresAt.toISOString()
    });

    response.json({
      ok: true,
      shareId: shareCode,
      shareUrl: `${openStageFrontendBaseUrl}/import-song/${shareCode}`
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Shared song create failed', error, {
      title: song.title,
      artist: song.artist
    });
    response.status(500).json({
      ok: false,
      error: 'Shared song could not be created.'
    });
  }
});

app.get('/api/shared-song/:id', async (request, response) => {
  const id = String(request.params.id || '').trim();

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('shared_songs')
      .select('song_json')
      .eq('share_code', id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (!data?.song_json) {
      response.status(404).json({
        ok: false,
        error: 'Shared song not found or expired.'
      });
      return;
    }

    console.log('Shared song retrieved:', {
      id,
      title: data.song_json.title,
      artist: data.song_json.artist
    });

    response.json({
      ok: true,
      song: data.song_json
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Shared song retrieve failed', error, { shareCode: id });
    response.status(500).json({
      ok: false,
      error: 'Shared song could not be retrieved.'
    });
  }
});

app.listen(port, () => {
  console.log(`openstage-api listening on port ${port}`);
});
