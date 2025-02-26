import { pgTable, timestamp, index, uuid, boolean } from "drizzle-orm/pg-core";
import { notificationType } from "./enums.model";
import { studentTable } from "./student.model";
import { relations } from "drizzle-orm";

export const notificationTable = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    from: uuid("from")
      .references(() => studentTable.id, { onDelete: "cascade" })
      .notNull(),
    to: uuid("to")
      .references(() => studentTable.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationType("type"),
    read: boolean("read").default(false),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    fromIndex: index("from_Index_notification").on(table.from),
    toIndex: index("to_Index_notification").on(table.to),
  }),
);

export const notificationTableRelations = relations(
  notificationTable,
  ({ one }) => ({
    from: one(studentTable, {
      fields: [notificationTable.from],
      references: [studentTable.id],
      relationName: "notifications_from",
    }),
    to: one(studentTable, {
      fields: [notificationTable.to],
      references: [studentTable.id],
      relationName: "notifications",
    }),
  }),
);
