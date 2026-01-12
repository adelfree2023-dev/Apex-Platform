FROM node:20-alpine AS base

# 1. Install turbo globally
RUN npm install turbo --global

FROM base AS builder
WORKDIR /app
COPY . .
# Prune the workspace to just the storefront app
RUN turbo prune --scope=storefront --docker

# 2. Installer stage
FROM base AS installer
WORKDIR /app

# Add lockfile and package.json's of pruned projects
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

# Config build
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Bake Environment Variables
ARG NEXT_PUBLIC_VENDURE_API_URL
ARG NEXT_PUBLIC_MANAGER_URL
ENV NEXT_PUBLIC_VENDURE_API_URL=$NEXT_PUBLIC_VENDURE_API_URL
ENV NEXT_PUBLIC_MANAGER_URL=$NEXT_PUBLIC_MANAGER_URL

# Build the project
RUN turbo run build --filter=storefront...

# Fix: Copy static assets to standalone directory (for Monorepo structure)
RUN mkdir -p apps/storefront/.next/standalone/apps/storefront/.next
RUN cp -r apps/storefront/.next/static apps/storefront/.next/standalone/apps/storefront/.next/static
# Copy public if exists (ensure directory exists first to avoid error if empty)
RUN cp -r apps/storefront/public apps/storefront/.next/standalone/apps/storefront/public || true

# 3. Runner stage
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app .

# Expose Next.js port
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Cmd to start Next.js app (using npm to avoid missing pnpm binary)
WORKDIR /app/apps/storefront
CMD ["npm", "start"]
