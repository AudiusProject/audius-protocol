FROM node:18-alpine AS base

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# First stage: Set up a minimal monorepo
FROM base AS turbo-builder

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN npm install turbo@1.10.14 --global

COPY . .
RUN turbo prune --scope=@audius/ddex-processor --scope=@audius/ddex-processor --docker

# Second stage: Install and build client and server dists
FROM base AS app-builder

WORKDIR /app
RUN apk add --no-cache python3 py3-pip make g++ curl bash libc6-compat git
RUN apk update

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=turbo-builder /app/out/json/ .
COPY --from=turbo-builder /app/out/package-lock.json ./package-lock.json
COPY --from=turbo-builder /app/scripts ./scripts

RUN CI=true npm i --maxsockets 1

# Build the app and its dependencies
COPY --from=turbo-builder /app/out/full/ .
COPY svgr-template.js svgr-template.js
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@audius/ddex-processor

# Final stage: Create a runnable image
FROM node:18-alpine AS runner

RUN apk add --no-cache python3 py3-pip make g++ curl bash libc6-compat
RUN apk update

WORKDIR /app
COPY --from=app-builder /app .
WORKDIR /app/packages/ddex/processor

EXPOSE 9001
CMD ["npm", "run", "start:prod"]
