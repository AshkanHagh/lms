import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { Client } from '@neondatabase/serverless';

const client = new Client(process.env.DATABASE_URL);
export const db = drizzle(client, {schema});