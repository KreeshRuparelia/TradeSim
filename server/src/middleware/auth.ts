import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { UserRow } from '../types';
import config from '../config';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        cognitoSub: string;
        email: string;
      };
    }
  }
}

interface TokenPayload {
  sub: string;
  email?: string;
  'cognito:username'?: string;
  email_verified?: boolean;
  iss: string;
  aud: string;
  token_use: string;
  exp: number;
  iat: number;
}

function base64UrlDecode(str: string): string {
  const pad = str.length % 4;
  if (pad) {
    str += '='.repeat(4 - pad);
  }
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString('utf-8');
}

function decodeToken(token: string): { header: { kid: string; alg: string }; payload: TokenPayload } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  
  return { header, payload };
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = decodeToken(token);
  
  // Verify issuer
  const expectedIssuer = `https://cognito-idp.${config.cognito.region}.amazonaws.com/${config.cognito.userPoolId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer');
  }
  
  // Verify audience (client ID) for id tokens
  if (payload.token_use === 'id' && payload.aud !== config.cognito.clientId) {
    throw new Error('Invalid token audience');
  }
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }
  
  return payload;
}

async function findOrCreateUser(cognitoSub: string, email: string): Promise<{ id: string; cognitoSub: string; email: string }> {
  const existing = await query<UserRow>(
    `SELECT * FROM users WHERE cognito_sub = $1 AND deleted_at IS NULL`,
    [cognitoSub]
  );

  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    if (user.email !== email) {
      await query(`UPDATE users SET email = $1 WHERE id = $2`, [email, user.id]);
    }
    return {
      id: user.id,
      cognitoSub: user.cognito_sub,
      email: email,
    };
  }

  const id = uuidv4();
  const result = await query<UserRow>(
    `INSERT INTO users (id, cognito_sub, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, cognitoSub, email]
  );
  
  console.log(`Created new user: ${email} (${id})`);
  
  return {
    id: result.rows[0].id,
    cognitoSub: result.rows[0].cognito_sub,
    email: result.rows[0].email,
  };
}

/**
 * Authentication middleware supporting both Cognito JWT and development mock auth.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Development mode: allow mock auth with X-User-Id header
    if (config.nodeEnv === 'development' && req.headers['x-user-id']) {
      const username = req.headers['x-user-id'] as string;
      const userEmail = req.headers['x-user-email'] as string || `${username}@example.com`;
      const cognitoSub = `mock-${username}`;
      
      const user = await findOrCreateUser(cognitoSub, userEmail);
      req.user = user;
      return next();
    }

    // Production mode: require Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    const email = payload.email || payload['cognito:username'] || '';
    if (!email) {
      throw new UnauthorizedError('Token missing email claim');
    }

    const user = await findOrCreateUser(payload.sub, email);
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      console.error('Auth error:', error);
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

/**
 * Optional auth middleware - sets user if token present, but doesn't require it
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-user-id'] as string;
    
    if (authHeader?.startsWith('Bearer ') || devUserId) {
      await authMiddleware(req, res, next);
    } else {
      next();
    }
  } catch {
    next();
  }
}
