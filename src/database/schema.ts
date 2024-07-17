import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, pgEnum, timestamp, index, text, integer, primaryKey, boolean } from 'drizzle-orm/pg-core';

export const PlanEnum = pgEnum('plan', ['free', 'premium']);
export const RoleEnum = pgEnum('role', ['teacher', 'admin', 'user']);
export const SubscriptionPeriodEnum = pgEnum('subscription_period', ['monthly', 'yearly']);
export const NotificationType = pgEnum('type', ['new_episode', 'replay', 'ticket']);

export const userTable = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', {length : 255}).notNull(),
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
    teacherId : uuid('teacher_id').references(() => userTable.id),
    completeTime : integer('complete_time').default(0),
    price : integer('price').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    titleIndex : index('title_index').on(table.title), teacherIndex : index('teacher_index').on(table.teacherId)
}));

export const courseDetailTable = pgTable('course_details', {
    courseId : uuid('course_id').primaryKey().references(() => courseTable.id),
    prerequisite : text('prerequisite').notNull(),
    view : integer('view').default(0),
    totalReviews : integer('reviews').default(0),
    totalRating : integer('rating').default(0),
    totalStudents : integer('students').default(0)
});

export const courseBenefitTable = pgTable('course_benefit', {
    courseId : uuid('course_id').references(() => courseTable.id),
    title : text('title').notNull(),
    details : text('details').notNull()
}, table => ({
    courseIdIndex : index('course_id_index').on(table.courseId)
}));

export const courseChaptersTable = pgTable('course_chapters', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id),
    title : text('title').notNull(),
    chapterEpisodes : integer('chapter_episodes').default(0)
}, table => ({
    courseIdIndex : index('course_id_index').on(table.courseId)
}));

export const chapterDetailsTable = pgTable('chapter_details', {
    chapterId : uuid('chapter_id').references(() => courseChaptersTable.id),
    title : text('title').notNull(),
    videoThumbnail : text('thumbnail').notNull(),
    videoUrl : text('url').notNull(),
    videoTime : integer('time').default(0),
}, table => ({
    courseIdIndex : index('course_id_index').on(table.chapterId)
}));

export const courseTagsTable = pgTable('course_tags', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id),
    tags : text('tags').notNull()
}, table => ({tagsIndex : index('tags_index').on(table.tags)}));

export const subscriptionTable = pgTable('subscriptions', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').references(() => userTable.id),
    plan : PlanEnum('plan').notNull(),
    period : SubscriptionPeriodEnum('subscription_period').notNull(),
    startDate : timestamp('start_date').defaultNow(),
    endDate : timestamp('endDate')
}, table => ({userIdIndex : index('user_id_index').on(table.userId)}));

export const purchaseCoursesTable = pgTable('purchase', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id),
    userId : uuid('user_id').references(() => userTable.id),
    createdAt : timestamp('created_at').defaultNow(),
});

export const purchaseDetailsTable = pgTable('purchase_details', {
    purchaseId : uuid('purchase_id').primaryKey().references(() => purchaseCoursesTable.id),
    totalPrice : integer('price').notNull(),
    discount : integer('discount').default(0),
    quantity : integer('quantity').default(1),
});

export const courseReviewTable = pgTable('course_reviews', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').references(() => courseTable.id),
    authorId : uuid('user_id').references(() => userTable.id),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
});

export const courseRatingTable = pgTable('ratings', {
    courseId : uuid('course_id').references(() => courseTable.id),
    userId : uuid('user_id').references(() => userTable.id),
    rate : integer('rate').default(0),
}, table => ({pk : primaryKey({columns : [table.courseId, table.userId]})}));

export const commentTable = pgTable('comments', {
    id : uuid('id').primaryKey().defaultRandom(),
    authorId : uuid('author_id').references(() => userTable.id),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({authorIdIndex : index('author_id_index').on(table.authorId)}));

export const repliesTable = pgTable('comment_replies', {
    id : uuid('id').primaryKey().defaultRandom(),
    commentId : uuid('comment_id').references(() => commentTable.id),
    authorId : uuid('author_id').references(() => userTable.id),
    text : text('text').notNull(),
    createdAt : timestamp('created_at').defaultNow(),
    updatedAt : timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
}, table => ({
    authorIdIndex : index('author_id_index').on(table.authorId), commentIdIndex : index('comment_id_index').on(table.commentId)
}));

export const courseCommentsTable = pgTable('course_comments', {
    courseId : uuid('course_id').references(() => courseTable.id),
    commentId : uuid('comment_id').references(() => commentTable.id)
}, table => ({pk : primaryKey({columns : [table.courseId, table.commentId]})}));

export const courseReviewsTable = pgTable('course_comments', {
    courseId : uuid('course_id').references(() => courseTable.id),
    reviewId : uuid('review_id').references(() => courseReviewTable.id)
}, table => ({pk : primaryKey({columns : [table.courseId, table.reviewId]})}));

export const notificationTable = pgTable('notifications', {
    id : uuid('id').primaryKey().defaultRandom(),
    from : uuid('from').references(() => userTable.id, {onDelete : 'cascade'}).notNull(),
    to : uuid('to').references(() => userTable.id, {onDelete : 'cascade'}).notNull(),
    type : NotificationType('type'),
    read : boolean('read').default(false),
    createdAt : timestamp('createdAt').defaultNow(),
    updatedAt : timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()),
}, table => {
    return {fromIndex : index('fromIndex_notificationTable').on(table.from)}
});

export const cartTable = pgTable('carts', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').references(() => userTable.id),
    courseId : uuid('course_id').references(() => courseTable.id),
}, table => ({userIdIndex : index('user_id_index').on(table.userId)}))

export const userTableRelations = relations(userTable, ({one, many}) => ({
    courses : many(courseTable),
    subscription : one(subscriptionTable),
    purchases : many(purchaseCoursesTable),
    reviews : many(courseReviewTable, {relationName : 'review_author'}),
    comments : many(courseCommentsTable, {relationName : 'comment_author'}),
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
    benefits : many(courseBenefitTable, {relationName : 'course_benefit'}),
    chapters : many(courseChaptersTable, {relationName : 'course_chapter'}),
    tags : many(courseTagsTable, {relationName : 'course_tag'}),
    purchases : many(purchaseCoursesTable, {relationName : 'course_purchase'}),
    reviews : many(courseReviewsTable, {relationName : 'course_review'}),
    comments : many(courseCommentsTable, {relationName : 'course_comment'}),
    rating : many(courseRatingTable, {relationName : 'course_rating'}),
    carts : many(cartTable, {relationName : 'course_cart'})
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