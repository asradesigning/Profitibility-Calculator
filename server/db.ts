import dotenv from 'dotenv';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set.');
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
