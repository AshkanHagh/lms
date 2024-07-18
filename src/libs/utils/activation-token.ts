import jwt from 'jsonwebtoken';
import type { TActivationToken, TModifiedUser, TVerifyActivationToken } from '../../types/index.type';

export const generateActivationToken = <T extends Partial<TModifiedUser>>(user : T) : TActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const activationToken = jwt.sign({user, activationCode}, process.env.ACTIVATION_TOKEN, {expiresIn : '5m'});

    return {activationToken, activationCode};
}

export const verifyActivationToken = (activationToken : string) : TVerifyActivationToken => {
    const {activationCode, user} = jwt.verify(activationToken, process.env.ACTIVATION_TOKEN) as TVerifyActivationToken;
    return {activationCode, user};
}