import fs from 'fs';
import path from 'path';
import { query, closePool } from './index';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await query<{ filename: string }>('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map((row) => row.filename);
}

async function runMigration(filename: string): Promise<void> {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  console.log(`Running migration: ${filename}`);

  await query(sql);
  await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);

  console.log(`Completed migration: ${filename}`);
}

async function migrate(): Promise<void> {
  try {
    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pendingMigrations = migrationFiles.filter(
      (file) => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s).`);

    for (const migration of pendingMigrations) {
      await runMigration(migration);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run migrations
migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
