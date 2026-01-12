FROM node:20-alpine AS base

# 1. Install turbo globally
RUN npm install turbo --global
RUN apk add --no-cache libc6-compat openssl

FROM base AS builder
WORKDIR /app
COPY . .
# Prune the workspace to just the engine app
RUN turbo prune --scope=@apex/engine --docker

# 2. Installer stage
FROM base AS installer
WORKDIR /app

# Add lockfile and package.json's of pruned projects
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies (using pnpm)
# Bypass corepack network issues by installing directly via npm
RUN npm install -g pnpm@8.15.0
RUN pnpm install --no-frozen-lockfile

# Config build
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Build the project
RUN turbo run build --filter=@apex/engine...

# 3. Runner stage
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer --chown=nestjs:nodejs /app .

CMD ["node", "apps/engine/dist/index.js"]
