import { eq } from 'drizzle-orm';
import { db } from '..';
import { userTable } from '../schema';
import type { SelectCondition, TModifiedUser, TSelectUser } from '../../types/index.type';

export const selectWithCondition = async <T extends 'emailOnly' | 'fullData'>(email : string, service : T) : 
Promise<SelectCondition<T>> => {
    if(service === 'emailOnly') {
        const desiredUser : Pick<TModifiedUser, 'email'>[] = await db.select({email : userTable.email})
        .from(userTable).where(eq(userTable.email, email));
        return desiredUser[0] as SelectCondition<T>;
    }
    const desiredUser : TSelectUser[] = await db.select().from(userTable).where(eq(userTable.email, email));
    return desiredUser[0] as SelectCondition<T>;
}

export const insertUserDetails = async (insertData : Partial<Pick<TSelectUser, 'name' | 'email' | 'image'>>) : Promise<TSelectUser> => {
    const [userDetails] : TSelectUser[] = await db.insert(userTable).values(
        insertData as Pick<TSelectUser, 'name' | 'email' | 'image'>).returning();
    return userDetails;
}

export const updateInformation = async (name : string, currentUserId : string) : Promise<{name : string | null}> => {
    const userDetail : {name : string | null}[] = await db.update(userTable).set({name}).
    where(eq(userTable.id, currentUserId)).returning({name : userTable.name});
    return userDetail[0];
}