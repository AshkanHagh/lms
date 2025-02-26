import type {
  CheckPurchaseReturnValue,
  CheckPurchaseValue,
  TSelectPurchases,
} from "../../types/index.type";
import { db } from "../index";
import { purchaseCoursesTable } from "../schema";

export const findPurchase = async <T extends CheckPurchaseReturnValue>(
  courseId: string,
  currentStudentId: string,
  returnValue: T,
): Promise<CheckPurchaseValue<T>> => {
  const columns =
    returnValue === "modified"
      ? {
          brand: false,
          card: false,
          expMonth: false,
          expYear: false,
          paymentId: false,
        }
      : undefined;

  const purchase: TSelectPurchases | undefined =
    await db.query.purchaseCoursesTable.findFirst({
      where: (table, funcs) =>
        funcs.and(
          funcs.eq(table.courseId, courseId),
          funcs.eq(table.studentId, currentStudentId),
        ),
      columns,
    });
  return purchase as CheckPurchaseValue<T>;
};

export const insertPurchase = async (
  purchaseDetail: Omit<TSelectPurchases, "id">,
): Promise<TSelectPurchases> => {
  return (
    await db
      .insert(purchaseCoursesTable)
      .values({ ...purchaseDetail })
      .returning()
  )[0];
};
