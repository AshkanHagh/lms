import { pgTable, timestamp, index, text, primaryKey, real, uuid } from 'drizzle-orm/pg-core';
import { courseTable } from './course.model';
import { studentTable } from './student.model';
import { relations } from 'drizzle-orm';

export const courseRatingTable = pgTable('ratings', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    studentId : uuid('user_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    rate : real('rate').default(0),
}, table => ({pk : primaryKey({columns : [table.courseId, table.studentId]})}));

export const commentTable = pgTable('comments', {
    id : uuid('id').primaryKey().defaultRandom(),
    authorId : uuid('author_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({authorIdIndex : index('authorId_index_comment').on(table.authorId)}));

export const repliesTable = pgTable('replies', {
    id : uuid('id').primaryKey().defaultRandom(),
    commentId : uuid('comment_id').references(() => commentTable.id, {onDelete : 'cascade'}),
    authorId : uuid('author_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    authorIdIndex : index('authorId_index_replies').on(table.authorId), 
    commentIdIndex : index('commentId_index_replies').on(table.commentId)
}));

export const reviewTable = pgTable('reviews', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    authorId : uuid('author_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    courseIdIndex : index('courseId_index_review').on(table.courseId), 
    authorIdIndex : index('authorId_index_review').on(table.authorId)
}));

export const courseCommentsTable = pgTable('course_comments', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    commentId : uuid('comment_id').references(() => commentTable.id, {onDelete : 'cascade'})
}, table => ({pk : primaryKey({columns : [table.courseId, table.commentId]})}));

export const courseReviewsTable = pgTable('course_reviews', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    reviewId : uuid('review_id').references(() => reviewTable.id, {onDelete : 'cascade'})
}, table => ({pk : primaryKey({columns : [table.courseId, table.reviewId]})}));

export const reviewTableRelations = relations(reviewTable, ({one}) => ({
    course : one(courseTable, {
        fields : [reviewTable.courseId],
        references : [courseTable.id]
    }),
    authorId : one(studentTable, {
        fields : [reviewTable.authorId],
        references : [studentTable.id]
    })
}))

export const courseRatingTableRelations = relations(courseRatingTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseRatingTable.courseId],
        references : [courseTable.id]
    }),
    user : one(studentTable, {
        fields : [courseRatingTable.studentId],
        references : [studentTable.id]
    }),
}));

export const commentTableRelations = relations(commentTable, ({one}) => ({
    author : one(studentTable, {
        fields : [commentTable.authorId],
        references : [studentTable.id]
    }),
}));

export const repliesTableRelations = relations(repliesTable, ({one}) => ({
    comment : one(commentTable, {
        fields : [repliesTable.commentId],
        references : [commentTable.id]
    }),
    author : one(studentTable, {
        fields : [repliesTable.authorId],
        references : [studentTable.id]
    }),
}));

export const courseCommentsTableRelations = relations(courseCommentsTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseCommentsTable.courseId],
        references : [courseTable.id]
    }),
    comment : one(commentTable, {
        fields : [courseCommentsTable.commentId],
        references : [commentTable.id]
    })
}));

export const courseReviewsTableRelations = relations(courseReviewsTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseReviewsTable.courseId],
        references : [courseTable.id]
    }),
    review : one(reviewTable, {
        fields : [courseReviewsTable.reviewId],
        references : [reviewTable.id]
    })
}));