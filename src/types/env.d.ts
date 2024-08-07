declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT : number;
      NODE_ENV : string;
      DATABASE_URL : string;
      POSTGRES_USER : string;
      POSTGRES_PASSWORD : string;
      POSTGRES_DB : string;
      REDIS_URL : string;
      UPSTASH_VECTOR_REST_URL : string;
      UPSTASH_VECTOR_REST_TOKEN : string;
      CLOUDINARY_CLOUD_NAME : string;
      CLOUDINARY_API_KEY : string;
      CLOUDINARY_API_SECRET : string;
      ACTIVATION_TOKEN : string;
      ACCESS_TOKEN : string;
      REFRESH_TOKEN : string;
      ACCESS_TOKEN_EXPIRE : string;
      REFRESH_TOKEN_EXPIRE : string;
      ORIGIN : string;
      STRIPE_MONTHLY_PLAN_LINK : string;
      STRIPE_YEARLY_PLAN_LINK : string;
      STRIPE_MONTHLY_PRICE_ID : string;
      STRIPE_YEARLY_PRICE_ID : string;
      STRIPE_SECRET_KEY : string;
      STRIPE_SUCCESS_URL : string;
      STRIPE_CANCEL_URL : string;
      SMTP_HOST : string;
      SMTP_PORT : number;
      SMTP_SERVICE : string;
      SMTP_MAIL : string;
      SMTP_PASSWORD : string;
      STRIPE_WEBHOOK_SECRET_LIVE_ENV : string;
      STRIPE_WEBHOOK_SECRET_DEV_ENV : string;
      STRIPE_BASE_URL : string;
    }
  }
}

export {}
