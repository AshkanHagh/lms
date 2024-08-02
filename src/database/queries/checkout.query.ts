import type { ModifiedPurchase, TSelectPurchases } from '../../types/index.type';
import { db } from '../index';
import { purchaseCoursesTable } from '../schema';

export const findPurchase = async (courseId : string, currentUserId : string) : Promise<ModifiedPurchase | undefined> => {
    const purchase : ModifiedPurchase | undefined = await db.query.purchaseCoursesTable.findFirst({
        where : (table, funcs) => funcs.and(funcs.eq(table.courseId, courseId), funcs.eq(table.userId, currentUserId)),
        columns : {brand : false, card : false, expMonth : false, expYear : false, paymentId : false}
    });
    return purchase;
}

export const insertPurchase = async (purchaseDetail : Omit<TSelectPurchases, 'id'>) : Promise<TSelectPurchases> => {
    const [newPurchase] : TSelectPurchases[] = await db.insert(purchaseCoursesTable).values({...purchaseDetail}).returning();
    return newPurchase
}