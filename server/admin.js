import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const inviteTtlMs = 7 * 24 * 60 * 60 * 1000;

export function normalizeAdminEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidAdminEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAdminEmail(value));
}

export function normalizeOpenStageRole(value) {
  return value === 'admin' ? 'admin' : 'user';
}

export function createInviteToken() {
  return randomBytes(32).toString('base64url');
}

export function hashInviteToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function inviteTokenMatches(rawToken, tokenHash) {
  const candidate = Buffer.from(hashInviteToken(rawToken), 'hex');
  const stored = Buffer.from(String(tokenHash || ''), 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function createInviteUrl(frontendBaseUrl, token) {
  return `${frontendBaseUrl.replace(/\/$/, '')}/invite?token=${encodeURIComponent(token)}`;
}

export function getInvitationStatus(invitation, now = new Date()) {
  if (invitation?.accepted_at) return 'Accepted';
  if (invitation?.revoked_at) return 'Revoked';
  const expiresAt = invitation?.expires_at ? new Date(invitation.expires_at) : null;
  if (expiresAt && expiresAt.getTime() < now.getTime()) return 'Expired';
  return 'Pending';
}

export function publicInvitation(invitation, now = new Date()) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: normalizeOpenStageRole(invitation.role),
    invitedBy: invitation.invited_by,
    createdAt: invitation.created_at,
    expiresAt: invitation.expires_at,
    acceptedAt: invitation.accepted_at,
    revokedAt: invitation.revoked_at,
    lastSentAt: invitation.last_sent_at,
    status: getInvitationStatus(invitation, now)
  };
}

export function publicProfile(profile) {
  return {
    userId: profile.user_id,
    email: profile.email || '',
    displayName: profile.display_name || '',
    role: normalizeOpenStageRole(profile.role),
    disabled: Boolean(profile.disabled),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  };
}

export function assertPendingInvitation(invitation, now = new Date()) {
  const status = getInvitationStatus(invitation, now);
  if (status !== 'Pending') {
    const error = new Error(`Invitation is ${status.toLowerCase()}.`);
    error.status = 400;
    throw error;
  }
}
