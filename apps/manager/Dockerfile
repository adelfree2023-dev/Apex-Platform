FROM node:20-alpine AS base

# 1. Install turbo globally
RUN npm install turbo --global

FROM base AS builder
WORKDIR /app
COPY . .
# Prune the workspace to just the manager app
RUN turbo prune --scope=@apex/manager --docker

# 2. Installer stage
FROM base AS installer
WORKDIR /app

# Add lockfile and package.json's of pruned projects
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies (using pnpm)
RUN corepack enable
RUN pnpm install --no-frozen-lockfile

# Config build
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma Client
RUN cd apps/manager && npx prisma generate

# Build the project
RUN turbo run build --filter=@apex/manager...

# 3. Runner stage
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer /app .

CMD ["node", "apps/manager/dist/main.js"]
