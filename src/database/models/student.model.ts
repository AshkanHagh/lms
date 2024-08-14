import { pgTable, varchar, timestamp, index, text, uuid } from 'drizzle-orm/pg-core';
import { completeState, courseTable } from './course.model';
import { purchaseCoursesTable, subscriptionTable } from './purchase.model';
import { commentTable, courseRatingTable } from './comments.model';
import { notificationTable } from './notification.model';
import { relations } from 'drizzle-orm';
import { planEnum, roleEnum } from './enums.model';

export const studentTable = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', {length : 255}),
    email : varchar('email', {length : 255}).unique().notNull(),
    plan : planEnum('plan').default('free'),
    customerId : varchar('customer_id', {length : 255}).unique(),
    role : roleEnum('role').default('student'),
    image : text('image'),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    emailIndex : index('student_email_index').on(table.email), roleIndex : index('student_role_index').on(table.role)
}));

export const userTableRelations = relations(studentTable, ({one, many}) => ({
    courses : many(courseTable),
    subscription : one(subscriptionTable),
    purchases : many(purchaseCoursesTable),
    comments : many(commentTable),
    ratings : many(courseRatingTable),
    from : one(notificationTable, {
        fields : [studentTable.id],
        references : [notificationTable.from],
        relationName : 'notifications_from'
    }),
    to : one(notificationTable, {
        fields : [studentTable.id],
        references : [notificationTable.to],
        relationName : 'notifications'
    }),
    complete_state : one(completeState)
}));