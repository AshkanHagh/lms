import { relations } from 'drizzle-orm';
import { pgTable, varchar, pgEnum, timestamp, index, text, primaryKey, boolean, smallint, real, uuid } from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'premium']);
export const roleEnum = pgEnum('role', ['teacher', 'admin', 'user']);
export const subscriptionPeriodEnum = pgEnum('subscription_period', ['monthly', 'yearly']);

export const notificationType = pgEnum('type', ['new_episode', 'replay', 'ticket']);
export const visibilityEnum = pgEnum('visibility', ['publish', 'unpublish']);
export const chapterVisibilityEnum = pgEnum('chapter_visibility', ['publish', 'draft']);

export const chapterEnum = pgEnum('chapter', ['free', 'premium']);

export const userTable = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', {length : 255}),
    email : varchar('email', {length : 255}).unique().notNull(),
    plan : planEnum('plan').default('free'),
    customerId : varchar('customer_id', {length : 255}).unique(),
    role : roleEnum('role').default('user'),
    image : text('image'),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    emailIndex : index('user_email_index').on(table.email), roleIndex : index('user_role_index').on(table.role)
}));

export const courseTable = pgTable('courses', {
    id : uuid('id').primaryKey().defaultRandom(),
    teacherId : uuid('teacher_id').references(() => userTable.id, {onDelete : 'cascade'}),
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
    userId : uuid('user_id').references(() => userTable.id),
    courseId : uuid('course_id').references(() => courseTable.id),
    chapterId : uuid('chapter_id').references(() => courseChaptersTable.id),
    percent : smallint('percent').default(0),
}, table => ({
    userIdIndex : index('complete_userId_index').on(table.userId), courseIdIndex : index('complete_course_id').on(table.courseId)
}));

export const subscriptionTable = pgTable('subscriptions', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    plan : planEnum('plan').notNull(),
    period : subscriptionPeriodEnum('subscription_period').notNull(),
    startDate : timestamp('start_date').defaultNow(),
    endDate : timestamp('endDate')
}, table => ({userIdIndex : index('userId_index_subscription').on(table.userId)}));

export const purchaseCoursesTable = pgTable('purchase', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    discount : real('discount').default(0),
    totalPrice : real('price').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
}, table => ({
    courseIdIndex : index('courseId_index_purchase').on(table.courseId), 
    userIdIndex : index('userId_index_purchase').on(table.userId)
}));

export const reviewTable = pgTable('reviews', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    authorId : uuid('author_id').references(() => userTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    courseIdIndex : index('courseId_index_review').on(table.courseId), 
    authorIdIndex : index('authorId_index_review').on(table.authorId)
}));

export const courseRatingTable = pgTable('ratings', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    rate : real('rate').default(0),
}, table => ({pk : primaryKey({columns : [table.courseId, table.userId]})}));

export const commentTable = pgTable('comments', {
    id : uuid('id').primaryKey().defaultRandom(),
    authorId : uuid('author_id').references(() => userTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({authorIdIndex : index('authorId_index_comment').on(table.authorId)}));

export const repliesTable = pgTable('replies', {
    id : uuid('id').primaryKey().defaultRandom(),
    commentId : uuid('comment_id').references(() => commentTable.id, {onDelete : 'cascade'}),
    authorId : uuid('author_id').references(() => userTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    authorIdIndex : index('authorId_index_replies').on(table.authorId), 
    commentIdIndex : index('commentId_index_replies').on(table.commentId)
}));

export const courseCommentsTable = pgTable('course_comments', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    commentId : uuid('comment_id').references(() => commentTable.id, {onDelete : 'cascade'})
}, table => ({pk : primaryKey({columns : [table.courseId, table.commentId]})}));

export const courseReviewsTable = pgTable('course_reviews', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    reviewId : uuid('review_id').references(() => reviewTable.id, {onDelete : 'cascade'})
}, table => ({pk : primaryKey({columns : [table.courseId, table.reviewId]})}));

export const notificationTable = pgTable('notifications', {
    id : uuid('id').primaryKey().defaultRandom(),
    from : uuid('from').references(() => userTable.id, {onDelete : 'cascade'}).notNull(),
    to : uuid('to').references(() => userTable.id, {onDelete : 'cascade'}).notNull(),
    type : notificationType('type'),
    read : boolean('read').default(false),
    createdAt : timestamp('createdAt').defaultNow(),
    updatedAt : timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()),
}, table => ({
    fromIndex : index('from_Index_notification').on(table.from), 
    toIndex : index('to_Index_notification').on(table.to), 
}));

export const userTableRelations = relations(userTable, ({one, many}) => ({
    courses : many(courseTable),
    subscription : one(subscriptionTable),
    purchases : many(purchaseCoursesTable),
    reviews : many(reviewTable),
    comments : many(commentTable),
    ratings : many(courseRatingTable),
    from : one(notificationTable, {
        fields : [userTable.id],
        references : [notificationTable.from],
        relationName : 'notifications_from'
    }),
    to : one(notificationTable, {
        fields : [userTable.id],
        references : [notificationTable.to],
        relationName : 'notifications'
    }),
    complete_state : one(completeState)
}));

export const courseTableRelations = relations(courseTable, ({one, many}) => ({
    teacher : one(userTable, {
        fields : [courseTable.teacherId],
        references : [userTable.id]
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
    user : one(userTable, {
        fields : [completeState.userId],
        references : [userTable.id]
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

export const courseChaptersTableRelations = relations(courseChaptersTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseChaptersTable.courseId],
        references : [courseTable.id]
    })
}));

export const chapterDetailsTableRelations = relations(chapterVideosTable, ({one}) => ({
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

export const subscriptionTableRelations = relations(subscriptionTable, ({one}) => ({
    user : one(userTable, {
        fields : [subscriptionTable.userId],
        references : [userTable.id]
    })
}));

export const purchaseCoursesTableRelations = relations(purchaseCoursesTable, ({one}) => ({
    course : one(courseTable, {
        fields : [purchaseCoursesTable.courseId],
        references : [courseTable.id]
    }),
    user : one(userTable, {
        fields : [purchaseCoursesTable.userId],
        references : [userTable.id]
    })
}));

export const reviewTableRelations = relations(reviewTable, ({one}) => ({
    course : one(courseTable, {
        fields : [reviewTable.courseId],
        references : [courseTable.id]
    }),
    authorId : one(userTable, {
        fields : [reviewTable.authorId],
        references : [userTable.id]
    })
}))

export const courseRatingTableRelations = relations(courseRatingTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseRatingTable.courseId],
        references : [courseTable.id]
    }),
    user : one(userTable, {
        fields : [courseRatingTable.userId],
        references : [userTable.id]
    }),
}));

export const commentTableRelations = relations(commentTable, ({one}) => ({
    author : one(userTable, {
        fields : [commentTable.authorId],
        references : [userTable.id]
    }),
}));

export const repliesTableRelations = relations(repliesTable, ({one}) => ({
    comment : one(commentTable, {
        fields : [repliesTable.commentId],
        references : [commentTable.id]
    }),
    author : one(userTable, {
        fields : [repliesTable.authorId],
        references : [userTable.id]
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

export const notificationTableRelations = relations(notificationTable, ({one}) => ({
    from : one(userTable, {
        fields : [notificationTable.from],
        references : [userTable.id],
        relationName : 'notifications_from'
    }),
    to : one(userTable, {
        fields : [notificationTable.to],
        references : [userTable.id],
        relationName : 'notifications'
    })
}));