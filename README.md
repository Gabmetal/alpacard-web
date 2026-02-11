# Alpacard Backoffice

A monolithic Next.js application for the Alpacard Loyalty Platform.

![CI - Dev](https://github.com/Gabmetal/alpa-card/actions/workflows/ci-dev.yml/badge.svg?branch=dev)
![CI - Main (Preview)](https://github.com/Gabmetal/alpa-card/actions/workflows/ci-main.yml/badge.svg?branch=main)

## Architecture

This project was recently refactored from a monorepo into a **true monolith** to simplify deployment and resolve dependency conflicts on Vercel.

- **Framework**: Next.js 15+ (App Router)
- **Runtime**: Node.js 22.x
- **ORM**: Prisma (MongoDB)
- **Auth**: Clerk

## Prerequisites

- Node.js 22.x (see `.nvmrc`)
- pnpm 9.x or 10.x

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Database
DATABASE_URL=your_mongodb_url

# Clerk URLs (Crucial for Auth flow)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate Prisma client**:
   ```bash
   pnpm db:generate
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

## Deployment

The project is configured for deployment on Vercel. The `vercel.json` file ensures that Prisma is generated during the build step.

All Clerk URL environment variables listed above MUST be set in the Vercel project settings for the authentication flow to work correctly.

## Project Structure

- `app/`: Next.js App Router pages and components.
- `actions/`: Server Actions for business logic.
- `lib/`: Shared utilities and database client.
- `prisma/`: Database schema definition.
- `public/`: Static assets.
