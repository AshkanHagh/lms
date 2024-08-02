import { pgTable, timestamp, index, text, smallint, uuid } from 'drizzle-orm/pg-core';
import { planEnum, subscriptionPeriodEnum } from './enums.model';
import { studentTable } from './student.model';
import { courseTable } from './course.model';
import { relations } from 'drizzle-orm';

export const subscriptionTable = pgTable('subscriptions', {
    id : uuid('id').primaryKey().defaultRandom(),
    studentId : uuid('user_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    plan : planEnum('plan').notNull(),
    period : subscriptionPeriodEnum('subscription_period').notNull(),
    startDate : timestamp('start_date').defaultNow(),
    endDate : timestamp('endDate')
}, table => ({studentIdIndex : index('student_id_index_subscription').on(table.studentId)}));

export const purchaseCoursesTable = pgTable('purchase', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    studentId : uuid('user_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    card : text('card'),
    brand : text('brand'),
    expMonth : smallint('exp_month'),
    expYear : smallint('exp_year'),
    paymentId : text('payment_id'),
    createdAt : timestamp('created_at').defaultNow(),
}, table => ({
    courseIdIndex : index('courseId_index_purchase').on(table.courseId), 
    studentIdIndex : index('studentId_index_purchase').on(table.studentId)
}));

export const subscriptionTableRelations = relations(subscriptionTable, ({one}) => ({
    user : one(studentTable, {
        fields : [subscriptionTable.studentId],
        references : [studentTable.id]
    })
}));

export const purchaseCoursesTableRelations = relations(purchaseCoursesTable, ({one}) => ({
    course : one(courseTable, {
        fields : [purchaseCoursesTable.courseId],
        references : [courseTable.id]
    }),
    user : one(studentTable, {
        fields : [purchaseCoursesTable.studentId],
        references : [studentTable.id]
    })
}));