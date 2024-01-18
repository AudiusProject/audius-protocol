FROM node:18-alpine AS base

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

# Prune turbo dependencies
FROM base AS builder

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN npm install turbo --global

COPY . .
RUN turbo prune --scope=@audius/ddex-frontend --scope=@audius/ddex --docker

# Install and build frontend and backend dists and run app
FROM base AS runner

WORKDIR /app

RUN apk add --no-cache python3 py3-pip make g++ curl bash libc6-compat
RUN apk update

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY --from=builder /app/scripts ./scripts

RUN CI=true npm i

# Build the app and its dependencies
COPY --from=builder /app/out/full/ .
COPY svgr-template.js svgr-template.js
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@audius/ddex-frontend --filter=@audius/ddex

COPY packages/ddex-frontend/dist /app/packages/ddex/public

WORKDIR /app/packages/ddex

EXPOSE 8926
CMD [ "node", "dist/index.js" ]
