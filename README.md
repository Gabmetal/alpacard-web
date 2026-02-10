# Alpacard - QR Loyalty Platform

## Overview
Alpacard is a digital loyalty platform that replaces physical stamp cards with QR codes. It consists of two main applications: a Provider Backoffice for business owners to manage campaigns and staff, and a Consumer PWA for customers to collect stamps.

## Tech Stack
-   **Monorepo**: Turbo + pnpm
-   **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS
-   **Database**: MongoDB (via Prisma ORM)
-   **Authentication**: Clerk
-   **Styling**: Shared UI package with Tailwind

## Project Structure
-   `apps/backoffice`: Provider portal (Next.js) - Port 3000
-   `apps/pwa`: Consumer wallet (Next.js PWA) - Port 3001
-   `packages/db`: Shared Prisma client and schema
-   `packages/ui`: Shared React components
-   `packages/config`: Shared ESLint and Tailwind configs

## Prerequisites
-   Node.js 18+
-   pnpm (`npm install -g pnpm`)
-   MongoDB Atlas account/connection string
-   Clerk account/API keys

## Setup

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Environment Variables**
    Create `.env` files in `apps/backoffice` and `apps/pwa`.
    Required variables:
    ```env
    DATABASE_URL="mongodb+srv://..."
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."
    NEXT_PUBLIC_APP_URL="http://localhost:3001" # Used in Backoffice to generate PWA links
    ```

3.  **Database Setup**
    Push the Prisma schema to your MongoDB database:
    ```bash
    pnpm db:push
    ```

## Running the App

Start the development servers for both apps:
```bash
pnpm dev
```
-   **Backoffice**: [http://localhost:3000](http://localhost:3000)
-   **PWA**: [http://localhost:3001](http://localhost:3001)

## Features & Usage

### 1. Provider (Backoffice)
-   **Sign Up**: Create a business account.
-   **Campaigns**: Create loyalty campaigns (e.g., "Buy 10 coffees, get 1 free").
-   **QR Generation**: Generate a static QR code for customers to scan and join the campaign.
-   **Staff Management**: Invite staff members via email to help manage stamps.
-   **Scanner**: Staff use the built-in scanner to scan customer QRs and award stamps.

### 2. Consumer (PWA)
-   **Claim Card**: Scan a campaign QR code (link like `/claim/[id]`) to add a digital card to your wallet.
-   **Wallet**: View all your loyalty cards and progress.
-   **Dynamic QR**: Show your dynamic QR code to staff to receive stamps.

## Deployment
This project is optimized for deployment on Vercel.
-   Connect your GitHub repository to Vercel.
-   Import each app (`apps/backoffice` and `apps/pwa`) as a separate project.
-   Set the appropriate **Root Directory** settings in Vercel for each project.
-   Add the Environment Variables in the Vercel dashboard.

---
Created by Gabriel Cavallo.
