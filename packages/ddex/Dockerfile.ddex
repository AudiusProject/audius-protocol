# Build stage for DDEX backend
FROM node:18.17-slim AS backend-dist

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

WORKDIR /backend

RUN npm install turbo --global
COPY . .
RUN turbo prune --scope=@audius/ddex --docker

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

RUN CI=true npm i

# Build the project and its dependencies
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@audius/ddex-server

# COPY server/package*.json server/tsconfig.json ./
# RUN npm install
# COPY server/src ./src
# RUN npm run build

# Build stage for DDEX frontend
FROM node:18.17-slim AS frontend-dist

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN
 
WORKDIR /app

RUN npm install turbo --global
COPY . .
RUN turbo prune --scope=@audius/ddex-frontend --docker

# RUN apt-get update && apt-get install -y \
#     python3 \
#     python3-pip \
#     make \
#     g++ \
#     curl \
#     bash \
#     && rm -rf /var/lib/apt/lists/*
# WORKDIR /frontend
# COPY server ./server
# COPY client/package*.json client/*config*.js client/tsconfig*.json client/vite.config.ts ./
# RUN npm install
# COPY client/src ./src
# COPY client/public ./public
# COPY client/index.html .
# RUN npm run build

RUN CI=true npm i

# Build the project and its dependencies
COPY turbo.json turbo.json
RUN npx turbo run build --filter=@audius/ddex-frontend

# Final stage
FROM node:18.17-slim
WORKDIR /usr/src/app
COPY --from=frontend-dist /app/packages/ddex/client/dist ./public
COPY --from=backend-dist /backend/packages/ddex/dist ./dist
COPY --from=backend-dist /backend/packages/ddex/node_modules ./node_modules

EXPOSE 8926
CMD [ "node", "dist/index.js" ]
