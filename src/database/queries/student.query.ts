import { eq } from 'drizzle-orm';
import { db } from '..';
import { studentTable } from '../schema';
import type { SelectCondition, TModifiedStudent, TSelectStudent } from '../../types/index.type';

export const selectWithCondition = async <T extends 'emailOnly' | 'fullData'>(email : string, service : T) : 
Promise<SelectCondition<T>> => {
    if(service === 'emailOnly') {
        const desiredUser : Pick<TModifiedStudent, 'email'>[] = await db.select({email : studentTable.email})
        .from(studentTable).where(eq(studentTable.email, email));
        return desiredUser[0] as SelectCondition<T>;
    }
    const desiredUser : TSelectStudent[] = await db.select().from(studentTable).where(eq(studentTable.email, email));
    return desiredUser[0] as SelectCondition<T>;
}

export const insertStudentDetails = async (insertData : Partial<Pick<TSelectStudent, 'name' | 'email' | 'image'>>) : Promise<TSelectStudent> => {
    const [userDetails] : TSelectStudent[] = await db.insert(studentTable).values(
        insertData as Pick<TSelectStudent, 'name' | 'email' | 'image'>).returning();
    return userDetails;
}

export const updateInformation = async (name : string, currentStudentId : string) : Promise<{name : string | null}> => {
    const userDetail : {name : string | null}[] = await db.update(studentTable).set({name}).
    where(eq(studentTable.id, currentStudentId)).returning({name : studentTable.name});
    return userDetail[0];
}