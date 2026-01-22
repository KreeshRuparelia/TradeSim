import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRow } from '../types';
import { NotFoundError } from '../utils/errors';

// Convert database row to API response format
function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
  };
}

// Find or create a user (called after Cognito authentication)
export async function findOrCreateUser(
  cognitoSub: string,
  email: string
): Promise<User> {
  // Try to find existing user
  const existing = await query<UserRow>(
    `SELECT * FROM users WHERE cognito_sub = $1 AND deleted_at IS NULL`,
    [cognitoSub]
  );

  if (existing.rows.length > 0) {
    // Update email if it changed
    if (existing.rows[0].email !== email) {
      await query(
        `UPDATE users SET email = $1 WHERE id = $2`,
        [email, existing.rows[0].id]
      );
    }
    return toUser(existing.rows[0]);
  }

  // Create new user
  const id = uuidv4();
  const result = await query<UserRow>(
    `INSERT INTO users (id, cognito_sub, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, cognitoSub, email]
  );

  return toUser(result.rows[0]);
}

export async function getUserById(userId: string): Promise<User> {
  const result = await query<UserRow>(
    `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return toUser(result.rows[0]);
}

export async function getUserByCognitoSub(cognitoSub: string): Promise<User> {
  const result = await query<UserRow>(
    `SELECT * FROM users WHERE cognito_sub = $1 AND deleted_at IS NULL`,
    [cognitoSub]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return toUser(result.rows[0]);
}

export async function deleteUser(userId: string): Promise<void> {
  const result = await query(
    `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('User not found');
  }
}
