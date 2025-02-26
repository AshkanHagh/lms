# TODO: update readme

# Lms
## [Version 1.0](https://magiclearning.up.railway.app/)

## Overview
The Lms API powers a Learning Management System, providing students with features like course registration, subscription-based access, and progress tracking. Built with scalability, performance, and security in mind,

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

### Clone the repository
```bash
git clone https://github.com/AshkanHagh/lms.git
cd lms
```

### Option 1: Using Docker Compose
The easiest way to get started is using Docker Compose, which will set up all the required services for you.

```bash
# Start all services with Docker Compose
docker-compose up -d

# When done, you can stop all services with
docker-compose down
```

### Option 2: Manual Setup
If you prefer to run the application manually:

1. **Install dependencies**:
```bash
bun install
```

2. **Set up your environment**:
   - Configure your database connection in `.env` file
   - Make sure you have all required services running locally

3. **Run the application**:
```bash
bun run dev # Run in development mode with --watch
```

### Available Scripts
```shell
bun run dev        # Run in development mode with --watch
bun run db:generate # Generate database schema with Drizzle
bun run db:migrate  # Apply database migrations with Drizzle
bun run db:studio   # Open Drizzle Studio for database management
```
