import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const migrationClient = neon(process.env.DATABASE_URL);
const migration = async () => {
    await migrate(drizzle(migrationClient), {migrationsFolder : './src/database/migrations'});
    process.exit(1);
}
migration();