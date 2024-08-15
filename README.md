# Magic Learning 
## [Version 1.0](https://magiclearning.up.railway.app/)

## Overview

Magic Learning API is a robust RESTful service built to power a Learning Management System (LMS) where students can register, explore, and enroll in various courses. The API supports two primary methods of course access: individual course purchase and subscription-based access. This API is crafted using modern technologies to ensure scalability, high performance, and secure transactions.

## Key Features

- **User Registration & Authentication**:
  - Students can register, log in, and manage their profiles.
  - Authentication is handled using JWT, with support for both access and refresh tokens.
  - Includes social authentication for seamless user onboarding.
  - Two-factor authentication (2FA) through verification codes.

- **Course Management**:
  - Students can browse and search for courses using semantic search powered by LangChain and Upstash Vector.
  - Courses can be filtered based on tags, with the top 10 most popular tags highlighted.
  - Each course provides the ability for students to mark lessons as complete, tracking their progress throughout the course.
  - Courses can be accessed either through individual purchases or via a monthly/yearly subscription model using Stripe.
  - Stripe integration supports complete subscription management, including purchase, cancellation, and updating of subscriptions.

- **Instructor Tools**:
  - Instructors can create, edit, and manage courses, including setting courses as public or private.
  - Detailed analytics are provided to instructors, showing sales performance and identifying top-performing courses.
  - Instructors can add chapters and videos to courses, and edit or publish them as drafts.

- **Search Functionality**:
  - Advanced semantic search using LangChain and Upstash Vector allows students to find relevant courses efficiently.
  - Courses can be filtered by tags and other criteria, enhancing the discovery experience.

- **Database**:
  - The API utilizes **PostgreSQL** as the primary relational database.
  - **Redis** is employed for caching and fast data access, using ioredis to ensure high performance.
  - Drizzle ORM is used for seamless database interaction and management.

- **Media Management**:
  - **Cloudinary** is integrated for efficient image and video management, allowing for smooth upload and retrieval of media assets.

- **Error Tracking & Monitoring**:
  - **Sentry** is implemented for real-time error tracking and monitoring, ensuring the API runs smoothly and issues are quickly identified and resolved.

- **Code Quality**:
  - **ESLint** is used to maintain code quality and consistency across the project.

## Getting Started

To set up the Magic Learning API, follow these steps:

**Clone the repository**:
```bash
git clone https://github.com/AshkanHagh/magic-learning.git
```
### Install dependencies:
```bash
cd magic-learning
bun install
```
### Setup .env file
Create a .env file in the root directory of your project and add the following environment variables:
``` shell
PORT
NODE_ENV
DATABASE_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
REDIS_URL
UPSTASH_VECTOR_REST_URL
UPSTASH_VECTOR_REST_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ACTIVATION_TOKEN
ACCESS_TOKEN
REFRESH_TOKEN
ACCESS_TOKEN_EXPIRE
REFRESH_TOKEN_EXPIRE
ORIGIN
SENTRY_KEY
STRIPE_MONTHLY_PLAN_LINK
STRIPE_YEARLY_PLAN_LINK
STRIPE_MONTHLY_PRICE_ID
STRIPE_YEARLY_PRICE_ID
STRIPE_SECRET_KEY
STRIPE_SUCCESS_URL
STRIPE_CANCEL_URL
STRIPE_BASE_URL
STRIPE_WEBHOOK_SECRET_DEV_ENV
SMTP_HOST
SMTP_PORT
SMTP_SERVICE
SMTP_MAIL
SMTP_PASSWORD
```

### Scripts
```shell
bun run dev # Run in development mode with --watch
bun run db:generate # Generate database schema with Drizzle
bun run db:migrate # Apply database migrations with Drizzle
bun run db:studio # Open Drizzle Studio for database management
```
