import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Client } from "@neondatabase/serverless";

const migrationClient = new Client(process.env.DATABASE_URL);
const migration = async () => {
    await migrate(drizzle(migrationClient), {migrationsFolder : './src/database/migrations'});
    await migrationClient.end();
}
migration();