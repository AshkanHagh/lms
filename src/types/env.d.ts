declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT : number;
      NODE_ENV : string;
      DATABASE_URL : string;
      REDIS_URL : string;
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;
      UPSTASH_VECTOR_REST_URL: string;
      UPSTASH_VECTOR_REST_TOKEN: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      ACTIVATION_TOKEN: string;
      ACCESS_TOKEN: string;
      REFRESH_TOKEN: string;
      ACCESS_TOKEN_EXPIRE: string;
      REFRESH_TOKEN_EXPIRE: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_SERVICE: string;
      SMTP_MAIL: string;
      SMTP_PASSWORD: string;
      ORIGIN: string;
      SENTRY_KEY: string;
      CLERK_PUBLISHABLE_KEY: string;
      CLERK_SECRET_KEY: string;
      STRIPE_MONTHLY_PLAN_LINK: string;
      STRIPE_YEARLY_PLAN_LINK: string;
      STRIPE_MONTHLY_PRICE_ID: string;
      STRIPE_YEARLY_PRICE_ID: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_SUCCESS_URL: string;
      STRIPE_CANCEL_URL: string;
    }
  }
}

export {}
