import jwt from 'jsonwebtoken';
import type { TActivationToken, TModifiedStudent, TVerifyActivationToken } from '../../types/index.type';

export const generateActivationToken = <T extends Partial<TModifiedStudent>>(student : T) : TActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const activationToken = jwt.sign({student, activationCode}, process.env.ACTIVATION_TOKEN, {expiresIn : '5m'});

    return {activationToken, activationCode};
}

export const verifyActivationToken = (activationToken : string) : TVerifyActivationToken => {
    const {activationCode, student} = jwt.verify(activationToken, process.env.ACTIVATION_TOKEN) as TVerifyActivationToken;
    return {activationCode, student};
}