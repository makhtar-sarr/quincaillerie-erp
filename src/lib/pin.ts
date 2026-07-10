const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(
  pin: string,
  salt: ArrayBuffer
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await deriveKey(pin, salt.buffer);
  return `${bufferToHex(salt.buffer)}:${bufferToHex(hash)}`;
}

export async function verifyPin(
  pin: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuffer(saltHex);
  const hash = await deriveKey(pin, salt);
  return bufferToHex(hash) === hashHex;
}
