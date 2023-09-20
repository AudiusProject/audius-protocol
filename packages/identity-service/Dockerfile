FROM node:18-alpine AS base
 
FROM base AS builder

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN npm install turbo --global

COPY . .
RUN turbo prune "--scope=identity-service" --docker

# INSTALL & BUILD
FROM base AS installer

WORKDIR /app

RUN npm install turbo --global
RUN apk add --no-cache libc6-compat git
RUN apk update
RUN apk add --no-cache python3 py3-pip make g++ bash

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY --from=builder /app/scripts ./scripts

RUN CI=true npm run install-packages

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Compile js code to typescript based on tsconfig.build.json
RUN turbo run build --filter=identity-service

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY packages/identity-service/scripts/wait /usr/bin/wait

ARG git_sha

ENV GIT_SHA=$git_sha

EXPOSE 7000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15m --retries=12 \
    CMD curl -f http://localhost:7000/health_check || exit 1

CMD ["bash", "scripts/start.sh"]
