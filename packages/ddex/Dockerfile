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
RUN npm install turbo --global

COPY . .
RUN turbo prune --scope=@audius/ddex-client --scope=@audius/ddex-server --docker

# Second stage: Install and build client and server dists
FROM base AS app-builder

WORKDIR /app
RUN apk add --no-cache python3 py3-pip make g++ curl bash libc6-compat
RUN apk update

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=turbo-builder /app/out/json/ .
COPY --from=turbo-builder /app/out/package-lock.json ./package-lock.json
COPY --from=turbo-builder /app/scripts ./scripts

RUN CI=true npm i

# Build the app and its dependencies
COPY --from=turbo-builder /app/out/full/ .
COPY svgr-template.js svgr-template.js
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@audius/ddex-client --filter=@audius/ddex-server

# Make a smaller image by removing all src directories (except for in node_modules)
RUN mv packages/ddex/client/dist packages/ddex/server/public
RUN rm -rf packages/ddex/client
RUN find packages -path '*/node_modules/*' -prune -o -name 'src' -type d -exec rm -rf {} +

# Final stage: Create a runnable image
FROM node:18-alpine AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app
COPY --from=app-builder --chown=nodejs:nodejs /app .
WORKDIR /app/packages/ddex/server

EXPOSE 3001
CMD ["node", "dist/index.js"]
