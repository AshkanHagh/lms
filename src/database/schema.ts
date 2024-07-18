import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, pgEnum, timestamp, index, text, integer, primaryKey, boolean } from 'drizzle-orm/pg-core';

export const PlanEnum = pgEnum('plan', ['free', 'premium']);
export const RoleEnum = pgEnum('role', ['teacher', 'admin', 'user']);
export const SubscriptionPeriodEnum = pgEnum('subscription_period', ['monthly', 'yearly']);
export const NotificationType = pgEnum('type', ['new_episode', 'replay', 'ticket']);

export const userTable = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', {length : 255}),
    email : varchar('email', {length : 255}).unique().notNull(),
    plan : PlanEnum('plan').default('free'),
    customerId : varchar('customer_id', {length : 255}).unique(),
    role : RoleEnum('role').default('user'),
    image : text('image'),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    emailIndex : index('email_index').on(table.email), roleIndex : index('role_index').on(table.role)
}));

export const courseTable = pgTable('courses', {
    id : uuid('id').primaryKey().defaultRandom(),
    title : text('title').notNull(),
    details : text('details').notNull(),
    teacherId : uuid('teacher_id').references(() => userTable.id, {onDelete : 'cascade'}),
    completeTime : integer('complete_time').default(0),
    price : integer('price').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    titleIndex : index('title_index').on(table.title), teacherIndex : index('teacher_index').on(table.teacherId)
}));

export const courseDetailTable = pgTable('course_details', {
    courseId : uuid('course_id').primaryKey().references(() => courseTable.id, {onDelete : 'cascade'}),
    prerequisite : text('prerequisite').notNull(),
    view : integer('view').default(0),
    totalReviews : integer('reviews').default(0),
    totalRating : integer('rating').default(0),
    totalStudents : integer('students').default(0)
});

export const courseBenefitTable = pgTable('course_benefit', {
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    title : text('title').notNull(),
    details : text('details').notNull()
}, table => ({
    courseIdIndex : index('courseId_index_benefit').on(table.courseId)
}));

export const courseChaptersTable = pgTable('course_chapters', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    title : text('title').notNull(),
    chapterEpisodes : integer('chapter_episodes').default(0)
}, table => ({
    courseIdIndex : index('courseId_index_chapter').on(table.courseId)
}));

export const chapterDetailsTable = pgTable('chapter_details', {
    chapterId : uuid('chapter_id').references(() => courseChaptersTable.id, {onDelete : 'cascade'}),
    title : text('title').notNull(),
    videoThumbnail : text('thumbnail').notNull(),
    videoUrl : text('url').notNull(),
    videoTime : integer('time').default(0),
}, table => ({
    courseIdIndex : index('courseId_index_chapterDetails').on(table.chapterId)
}));

export const courseTagsTable = pgTable('course_tags', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    tags : text('tags').notNull()
}, table => ({tagsIndex : index('tags_index').on(table.tags)}));

export const subscriptionTable = pgTable('subscriptions', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    plan : PlanEnum('plan').notNull(),
    period : SubscriptionPeriodEnum('subscription_period').notNull(),
    startDate : timestamp('start_date').defaultNow(),
    endDate : timestamp('endDate')
}, table => ({userIdIndex : index('userId_index_subscription').on(table.userId)}));

export const purchaseCoursesTable = pgTable('purchase', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    createdAt : timestamp('created_at').defaultNow(),
}, table => ({
    courseIdIndex : index('courseId_index_purchase').on(table.courseId), 
    userIdIndex : index('userId_index_purchase').on(table.userId)
}));

export const purchaseDetailsTable = pgTable('purchase_details', {
    purchaseId : uuid('purchase_id').primaryKey().references(() => purchaseCoursesTable.id),
    totalPrice : integer('price').notNull(),
    discount : integer('discount').default(0),
    quantity : integer('quantity').default(1),
});

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
    rate : integer('rate').default(0),
}, table => ({pk : primaryKey({columns : [table.courseId, table.userId]})}));

export const commentTable = pgTable('comments', {
    id : uuid('id').primaryKey().defaultRandom(),
    authorId : uuid('author_id').references(() => userTable.id, {onDelete : 'cascade'}),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({authorIdIndex : index('authorId_index_comment').on(table.authorId)}));

export const repliesTable = pgTable('comment_replies', {
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
    type : NotificationType('type'),
    read : boolean('read').default(false),
    createdAt : timestamp('createdAt').defaultNow(),
    updatedAt : timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()),
}, table => ({
    fromIndex : index('from_Index_notification').on(table.from), 
    toIndex : index('to_Index_notification').on(table.to), 
}));

export const cartTable = pgTable('carts', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').references(() => userTable.id, {onDelete : 'cascade'}),
    courseId : uuid('course_id').references(() => courseTable.id, {onDelete : 'cascade'}),
}, table => ({userIdIndex : index('userId_index_cart').on(table.userId)}))

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
    carts : many(cartTable)
}));

export const courseTableRelations = relations(courseTable, ({one, many}) => ({
    teacher : one(userTable, {
        fields : [courseTable.teacherId],
        references : [userTable.id]
    }),
    details : one(courseDetailTable),
    benefits : many(courseBenefitTable),
    chapters : many(courseChaptersTable),
    tags : many(courseTagsTable),
    purchases : many(purchaseCoursesTable),
    reviews : many(reviewTable),
    comments : many(courseCommentsTable),
    rating : many(courseRatingTable),
    carts : many(cartTable)
}));

export const courseDetailTableRelations = relations(courseDetailTable, ({one}) => ({
    course : one(courseTable, {
        fields : [courseDetailTable.courseId],
        references : [courseTable.id]
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

export const chapterDetailsTableRelations = relations(chapterDetailsTable, ({one}) => ({
    chapter : one(courseChaptersTable, {
        fields : [chapterDetailsTable.chapterId],
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

export const purchaseDetailsTableRelations = relations(purchaseDetailsTable, ({one}) => ({
    purchase : one(purchaseCoursesTable, {
        fields : [purchaseDetailsTable.purchaseId],
        references : [purchaseCoursesTable.id]
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

export const cartTableRelations = relations(cartTable, ({one}) => ({
    course : one(courseTable, {
        fields : [cartTable.courseId],
        references : [courseTable.id]
    }),
    user : one(userTable, {
        fields : [cartTable.userId],
        references : [userTable.id]
    }),
}))