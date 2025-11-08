import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt buffer using AES-256-CBC
 */
export function encryptBuffer(buffer: Buffer, key: string): Buffer {
  const keyHash = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyHash, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  // Prepend IV to encrypted data
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypt buffer using AES-256-CBC
 */
export function decryptBuffer(encryptedBuffer: Buffer, key: string): Buffer {
  const keyHash = crypto.createHash('sha256').update(key).digest();

  // Extract IV from the beginning of the buffer
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const encrypted = encryptedBuffer.slice(IV_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, keyHash, iv);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

/**
 * Encrypt string using AES-256-CBC
 * Returns base64 encoded string for easy storage in database
 */
export function encryptString(text: string, key: string): string {
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = encryptBuffer(buffer, key);
  return encrypted.toString('base64');
}

/**
 * Decrypt string using AES-256-CBC
 * Takes base64 encoded string and returns original text
 */
export function decryptString(encryptedText: string, key: string): string {
  const encryptedBuffer = Buffer.from(encryptedText, 'base64');
  const decrypted = decryptBuffer(encryptedBuffer, key);
  return decrypted.toString('utf8');
}

