declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT : number;
      NODE_ENV : string;
      DATABASE_URL : string;
      UPSTASH_REDIS_REST_URL : string;
      UPSTASH_REDIS_REST_TOKEN : string;
      UPSTASH_VECTOR_REST_URL : string;
      UPSTASH_VECTOR_REST_TOKEN : string;
      ACTIVATION_TOKEN : string;
      ACCESS_TOKEN : string;
      REFRESH_TOKEN : string;
      ACCESS_TOKEN_EXPIRE : string;
      REFRESH_TOKEN_EXPIRE : string;
      SMTP_HOST : string;
      SMTP_PORT : string;
      SMTP_SERVICE : string;
      SMTP_MAIL : string;
      SMTP_PASSWORD : string;
      ORIGIN : string;
      SENTRY_KEY : string;
    }
  }
}

export {}
