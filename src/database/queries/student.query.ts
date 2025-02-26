import { eq, sql } from "drizzle-orm";
import { db } from "..";
import {
  courseTable,
  purchaseCoursesTable,
  studentTable,
  subscriptionTable,
} from "../schema";
import type {
  AnalyticsPurchase,
  CourseWithPurchase,
  TInsertSubscription,
  TSelectStudent,
  TSelectSubscription,
} from "../../types/index.type";
import {
  deleteHashCache,
  getAllHashCache,
  insertHashCache,
} from "../cache/index.cache";

export type ReturnCondition = "emailOnly" | "fullData";

export const selectWithCondition = async <T extends ReturnCondition, B>(
  email: string,
  condition: T,
): Promise<B> => {
  const selectFullData = async (email: string): Promise<B> => {
    return (
      await db.select().from(studentTable).where(eq(studentTable.email, email))
    )[0] as B;
  };
  const selectOnlyEmail = async (email: string): Promise<B> => {
    return (
      await db
        .select({ email: studentTable.email })
        .from(studentTable)
        .where(eq(studentTable.email, email))
    )[0] as B;
  };

  const conditionHandlers: Record<
    ReturnCondition,
    (email: string) => Promise<B>
  > = {
    emailOnly: selectOnlyEmail,
    fullData: selectFullData,
  };
  return await conditionHandlers[condition](email);
};

export const insertStudentDetails = async (
  insertData: Partial<Pick<TSelectStudent, "name" | "email" | "image">>,
): Promise<TSelectStudent> => {
  const [userDetails]: TSelectStudent[] = await db
    .insert(studentTable)
    .values(insertData as Pick<TSelectStudent, "name" | "email" | "image">)
    .returning();
  return userDetails;
};

export const updateInformation = async (
  name: string,
  currentStudentId: string,
): Promise<{ name: string | null }> => {
  return (
    await db
      .update(studentTable)
      .set({ name })
      .where(eq(studentTable.id, currentStudentId))
      .returning({ name: studentTable.name })
  )[0];
};

export const updateCustomerId = async (
  currentStudentId: string,
  customerId: string,
): Promise<void> => {
  await db
    .update(studentTable)
    .set({ customerId })
    .where(eq(studentTable.id, currentStudentId));
};

export const updateStudentPlan = async (
  currentStudentId: string,
  plan: "premium" | "free",
): Promise<TSelectStudent> => {
  return (
    await db
      .update(studentTable)
      .set({ plan })
      .where(eq(studentTable.id, currentStudentId))
      .returning()
  )[0];
};

export const updateSubscription = async (
  currentStudentId: string,
  subscriptionDetail: Omit<TInsertSubscription, "studentId">,
): Promise<TSelectSubscription> => {
  return (
    await db
      .update(subscriptionTable)
      .set(subscriptionDetail)
      .where(eq(subscriptionTable.studentId, currentStudentId))
      .returning()
  )[0];
};

export const insertSubscription = async (
  currentStudentId: string,
  subscriptionDetail: TInsertSubscription,
): Promise<TSelectSubscription> => {
  return (
    await db
      .insert(subscriptionTable)
      .values({ ...subscriptionDetail, studentId: currentStudentId })
      .returning()
  )[0];
};

export const handleSubscription = async (
  currentStudentId: string,
  subscriptionDetail: TInsertSubscription,
): Promise<TSelectSubscription> => {
  const isSubscriptionExists: TSelectSubscription = await getAllHashCache(
    `student_subscription:${currentStudentId}`,
  );
  if (!isSubscriptionExists || Object.keys(isSubscriptionExists).length === 0) {
    return await insertSubscription(currentStudentId, subscriptionDetail);
  }
  return await updateSubscription(currentStudentId, subscriptionDetail);
};

export const deleteSubscription = async (studentId: string): Promise<void> => {
  await db.transaction(async (trx) => {
    await trx
      .delete(subscriptionTable)
      .where(eq(subscriptionTable.studentId, studentId));
    await trx
      .update(studentTable)
      .set({ plan: "free" })
      .where(eq(studentTable.id, studentId));
    await Promise.all([
      deleteHashCache(`student_subscription:${studentId}`),
      insertHashCache<string>(`student:${studentId}`, { plan: "free" }),
    ]);
  });
};

export const subscriptionDetail = async (
  studentId: string,
): Promise<TSelectSubscription | undefined> => {
  return await db.query.subscriptionTable.findFirst({
    where: (table, funcs) => funcs.eq(table.studentId, studentId),
  });
};

export const countCoursePurchases = async (
  currentTeacherId: string,
): Promise<AnalyticsPurchase[]> => {
  const coursePurchaseDetail: CourseWithPurchase[] = await db
    .select({
      courseId: courseTable.id,
      courseTitle: courseTable.title,
      coursePrice: courseTable.price,
      purchaseCount: sql<number>`COUNT(${purchaseCoursesTable.courseId})`,
    })
    .from(courseTable)
    .leftJoin(
      purchaseCoursesTable,
      eq(courseTable.id, purchaseCoursesTable.courseId),
    )
    .where(eq(courseTable.teacherId, currentTeacherId))
    .groupBy(courseTable.id);

  return coursePurchaseDetail.map(
    ({ courseTitle, purchaseCount, courseId, coursePrice }) => ({
      courseId,
      courseTitle,
      totalRevenue: +coursePrice! * +purchaseCount,
      purchaseCount: +purchaseCount,
    }),
  );
};
