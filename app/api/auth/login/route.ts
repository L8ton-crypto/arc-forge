import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken } from '@/lib/auth';

// Rate limiting (simple in-memory)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record || record.resetAt < now) {
    return false;
  }
  
  return record.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record || record.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count++;
  }
}

export async function POST(request: Request) {
  const ip = getClientIP(request);
  
  // Check rate limit
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }
  
  try {
    const { password } = await request.json();
    
    if (!password || typeof password !== 'string') {
      recordAttempt(ip);
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }
    
    const valid = await verifyPassword(password);
    
    if (!valid) {
      recordAttempt(ip);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Create session token
    const token = createSessionToken();
    
    return NextResponse.json({
      success: true,
      token,
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    });
    
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
