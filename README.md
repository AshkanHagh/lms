# LMS API

## Introduction
LMS API is a backend service for managing online learning platforms. It enables student registration, authentication, course subscriptions, and progress tracking. Designed for scalability, performance, and security, it supports instructors in managing courses, chapters, and videos while ensuring seamless user experience.


---

## Features

### Authentication
- JWT-based authentication (access & refresh tokens)
- Two-factor authentication (2FA)
- User profile management

### Courses
- Advanced search using **LangChain** & **Upstash Vector**
- Tag-based filtering (highlights top 10 most popular tags)
- Lesson progress tracking & completion status
- Purchase options: **one-time payment** or **Stripe subscription** (monthly/yearly)
- Full subscription management (purchase, cancel, update)

### Instructor Tools
- Create, edit & manage courses (public/private)
- Add, edit, and publish chapters & videos
- Detailed sales & performance analytics

### Database & Caching
- **PostgreSQL** as the primary relational database
- **Redis** caching with `ioredis` for fast access
- **Drizzle ORM** for database operations

### Media Management
- **Cloudinary** for handling image & video uploads

### Monitoring & Code Quality
- **Sentry** for real-time error tracking
- **ESLint** for maintaining code consistency

---

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/AshkanHagh/lms.git
cd lms
```

### Option 1: Using Docker Compose
Set up all required services quickly with Docker Compose:
```bash
# Copy environment variables file and configure it
cp .env.example .env

docker-compose up -d
# Stop all services when done
docker-compose down
```

### Option 2: Manual Setup
If you prefer manual setup:

1. **Install dependencies**:
```bash
bun install
```

2. **Configure Environment**:
   - Copy `.env.example` to `.env` and fill in all required values
   - Ensure all required services (database, caching, media storage) are running locally

3. **Run the Application**:
```bash
bun run dev # Starts in development mode with hot reload
```

### Available Scripts
```bash
bun run dev        # Start development server with watch mode
bun run db:generate # Generate database schema with Drizzle
bun run db:migrate  # Apply database migrations with Drizzle
bun run db:studio   # Open Drizzle Studio for database management
```
