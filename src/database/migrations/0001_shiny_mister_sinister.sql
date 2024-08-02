ALTER TYPE "role" ADD VALUE 'student';--> statement-breakpoint
DROP INDEX IF EXISTS "complete_userId_index";--> statement-breakpoint
DROP INDEX IF EXISTS "userId_index_purchase";--> statement-breakpoint
DROP INDEX IF EXISTS "userId_index_subscription";--> statement-breakpoint
DROP INDEX IF EXISTS "user_email_index";--> statement-breakpoint
DROP INDEX IF EXISTS "user_role_index";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "complete_studentId_index" ON "complete_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "studentId_index_purchase" ON "purchase" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_id_index_subscription" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_email_index" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_role_index" ON "users" USING btree ("role");