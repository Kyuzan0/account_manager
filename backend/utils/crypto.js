const crypto = require('crypto');

/**
 * Simple AES-256-GCM encryption utilities for secrets at rest.
 * - Key source: ACCOUNT_ENCRYPTION_KEY (32-byte base64) or derived from JWT_SECRET (fallback).
 * - Format: enc:<base64(iv)>:<base64(tag)>:<base64(ciphertext)>
 */

function getKey() {
  const explicit = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (explicit) {
    const buf = Buffer.from(explicit, 'base64');
    if (buf.length === 32) return buf;
  }
  // Fallback: derive from JWT_SECRET (not ideal but better than plaintext)
  const secret = process.env.JWT_SECRET || 'fallback-secret-not-for-production';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptSecret(plaintext) {
  if (typeof plaintext !== 'string') plaintext = String(plaintext ?? '');
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:');
}

function decryptSecret(encValue) {
  if (!isEncrypted(encValue)) return encValue;
  const [, ivb64, tagb64, ctb64] = encValue.split(':');
  const iv = Buffer.from(ivb64, 'base64');
  const tag = Buffer.from(tagb64, 'base64');
  const ct = Buffer.from(ctb64, 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = {
  encryptSecret,
  decryptSecret,
  isEncrypted,
};