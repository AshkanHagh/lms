import { pgEnum } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "premium"]);
export const roleEnum = pgEnum("role", ["teacher", "student"]);

export const visibilityEnum = pgEnum("visibility", ["publish", "unpublish"]);
export const chapterVisibilityEnum = pgEnum("chapter_visibility", [
  "publish",
  "draft",
]);
export const chapterEnum = pgEnum("chapter", ["free", "premium"]);

export const subscriptionPeriodEnum = pgEnum("subscription_period", [
  "monthly",
  "yearly",
]);
export const notificationType = pgEnum("type", [
  "new_episode",
  "replay",
  "ticket",
]);
