import jwt, { type JwtPayload } from "jsonwebtoken";
import type {
  TCookieOptions,
  TokenResponse,
  TSelectStudent,
} from "../../types/index.type";
import type { Response } from "express";
import { insertHashCache } from "../../database/cache/index.cache";

const accessTokenExpires: number = parseInt(process.env.ACCESS_TOKEN_EXPIRE);
const refreshTokenExpire: number = parseInt(process.env.REFRESH_TOKEN_EXPIRE);

export const accessTokenOptions = <TCookieOptions>{
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  sameSite: "lax",
  httpOnly: true,
};

export const refreshTokenOptions = <TCookieOptions>{
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  sameSite: "lax",
  httpOnly: true,
};

export const sendToken = async <T extends "refresh" | "login">(
  student: TSelectStudent,
  res: Response,
  tokenFor: T,
): Promise<TokenResponse<T>> => {
  const accessToken = jwt.sign(student, process.env.ACCESS_TOKEN, {
    expiresIn: `${accessTokenExpires}m`,
  });
  const refreshToken = jwt.sign(student, process.env.REFRESH_TOKEN, {
    expiresIn: `${refreshTokenExpire}d`,
  });

  process.env.NODE_ENV === "production"
    ? (accessTokenOptions.secure = true)
    : (accessTokenOptions.secure = false);
  await insertHashCache(`student:${student.id}`, student);

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  if (tokenFor === "refresh") return { accessToken } as TokenResponse<T>;
  const { createdAt, customerId, updatedAt, ...sanitizedStudent } = student;
  return { accessToken, sanitizedStudent } as TokenResponse<T>;
};

export const decodeRefreshToken = <T extends TSelectStudent | JwtPayload>(
  refreshToken: string,
): T => {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN) as T;
};

export const decodeAccessToken = <T extends TSelectStudent | JwtPayload>(
  accessToken: string,
): T => {
  return jwt.verify(accessToken, process.env.ACCESS_TOKEN) as T;
};
