import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { Pool  } from '@neondatabase/serverless';

const client = new Pool({connectionString : process.env.DATABASE_URL});
export const db = drizzle(client, {schema});