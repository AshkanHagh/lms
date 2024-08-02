import { pgTable, varchar, timestamp, index, text, smallint, real, uuid } from 'drizzle-orm/pg-core';
import { studentTable } from './student.model';
import { chapterEnum, chapterVisibilityEnum, visibilityEnum } from './enums.model';
import { relations } from 'drizzle-orm';
import { purchaseCoursesTable } from './purchase.model';
import { courseCommentsTable, courseRatingTable, reviewTable } from './comments.model';

export const courseTable = pgTable('courses', {
    id : uuid('id').primaryKey().defaultRandom(),
    teacherId : uuid('teacher_id').references(() => studentTable.id, {onDelete : 'cascade'}),
    title : text('title').notNull(),
    description : text('description'),
    prerequisite : text('prerequisite'),
    price : real('price'),
    image : text('image'),
    visibility : visibilityEnum('visibility').default('unpublish'),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    titleIndex : index('course_title_index').on(table.title), descriptionIndex : index('course_index').on(table.description),
    teacherIndex : index('course_teacherId_index').on(table.teacherId)
}));

export const courseBenefitTable = pgTable('benefit', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    title : text('title').notNull(),
    details : text('details').notNull()
}, table => ({
    courseIdIndex : index('benefit_courseId_index').on(table.courseId)
}));

export const courseChaptersTable = pgTable('chapters', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    title : varchar('title', {length : 255}).notNull(),
    description : text('description').notNull(),
    visibility : chapterVisibilityEnum('visibility').default('draft'),
}, table => ({
    courseIdIndex : index('courseId_index_chapter').on(table.courseId)
}));

export const chapterVideosTable = pgTable('videos', {
    id : uuid('id').primaryKey().defaultRandom(),
    chapterId : uuid('chapter_id').references(() => courseChaptersTable.id, {onDelete : 'cascade'}),
    videoTitle : text('title').notNull(),
    videoUrl : text('video_url').notNull(),
    state : chapterEnum('state').default('premium')
}, table => ({
    courseIdIndex : index('courseId_index_chapterDetails').on(table.chapterId)
}));

export const courseTagsTable = pgTable('tags', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    tags : text('tags').notNull()
}, table => ({tagsIndex : index('tags_index').on(table.tags)}));

export const completeState = pgTable('complete_state', {
    id : uuid('id').primaryKey().defaultRandom(),
    studentId : uuid('user_id').references(() => studentTable.id),
    courseId : uuid('course_id').references(() => courseTable.id),
    chapterId : uuid('chapter_id').references(() => courseChaptersTable.id),
    percent : smallint('percent').default(0),
}, table => ({
    studentIdIndex : index('complete_studentId_index').on(table.studentId), courseIdIndex : index('complete_course_id').on(table.courseId)
}));

export const courseTableRelations = relations(courseTable, ({one, many}) => ({
    teacher : one(studentTable, {
        fields : [courseTable.teacherId],
        references : [studentTable.id]
    }),
    benefits : many(courseBenefitTable),
    chapters : many(courseChaptersTable),
    tags : many(courseTagsTable),
    completeState : many(completeState),
    purchases : many(purchaseCoursesTable),
    reviews : many(reviewTable),
    comments : many(courseCommentsTable),
    rating : many(courseRatingTable),
}));

export const completeStateRelations = relations(completeState, ({one}) => ({
    course : one(courseTable, {
        fields : [completeState.courseId],
        references : [courseTable.id]
    }),
    user : one(studentTable, {
        fields : [completeState.studentId],
        references : [studentTable.id]
    }),
    chapter : one(courseChaptersTable, {
        fields : [completeState.chapterId],
        references : [courseChaptersTable.id]
    })
}));

export const courseBenefitTableRelations = relations(courseBenefitTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseBenefitTable.courseId],
        references : [courseTable.id]
    })
}));

export const courseChaptersTableRelations = relations(courseChaptersTable, ({one, many}) => ({
    course : one(courseTable, {
        fields : [courseChaptersTable.courseId],
        references : [courseTable.id]
    }),
    videos : many(chapterVideosTable)
}));

export const chapterVideosTableRelations = relations(chapterVideosTable, ({one}) => ({
    chapter : one(courseChaptersTable, {
        fields : [chapterVideosTable.chapterId],
        references : [courseChaptersTable.id]
    })
}));

export const courseTagsTableRelations = relations(courseTagsTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseTagsTable.courseId],
        references : [courseTable.id]
    })
}));