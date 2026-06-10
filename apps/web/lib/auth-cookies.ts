export const ACCESS_TOKEN_COOKIE = 'aiwms_access_token';
export const REFRESH_TOKEN_COOKIE = 'aiwms_refresh_token';

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
