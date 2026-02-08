import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const PASSWORD_HASH = process.env.BOARD_PASSWORD_HASH || '';
const API_KEY = process.env.BOARD_API_KEY || '';
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

// Session tokens (in-memory for simplicity - could use Redis for production)
const validSessions = new Map<string, { expires: number }>();

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of validSessions.entries()) {
    if (session.expires < now) {
      validSessions.delete(token);
    }
  }
}, 60000); // Every minute

export async function verifyPassword(password: string): Promise<boolean> {
  if (!PASSWORD_HASH) return false;
  return bcrypt.compare(password, PASSWORD_HASH);
}

export function createSessionToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Session valid for 24 hours
  validSessions.set(token, { expires: Date.now() + 24 * 60 * 60 * 1000 });
  return token;
}

export function verifySessionToken(token: string): boolean {
  const session = validSessions.get(token);
  if (!session) return false;
  if (session.expires < Date.now()) {
    validSessions.delete(token);
    return false;
  }
  return true;
}

export function verifyApiKey(key: string): boolean {
  if (!API_KEY) return false;
  // Timing-safe comparison
  if (key.length !== API_KEY.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(API_KEY));
}

export function isAuthorized(request: Request): boolean {
  // Check for API key in Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (verifyApiKey(token)) return true;
  }
  
  // Check for session token in X-Session-Token header
  const sessionToken = request.headers.get('X-Session-Token');
  if (sessionToken && verifySessionToken(sessionToken)) return true;
  
  return false;
}
