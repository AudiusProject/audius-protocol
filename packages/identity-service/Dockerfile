# Uses separate stage for nodejs deps despite caching to avoid installing build tools
FROM node:18.17 as builder
RUN apt-get install make
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:18.17-alpine

WORKDIR /usr/src/app

RUN apk update && apk add rsyslog python3 python3-dev py3-pip curl bash

COPY --from=builder /app/node_modules ./node_modules

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY scripts/wait /usr/bin/wait

COPY . .

# Compile js code to typescript based on tsconfig.build.json
RUN npm run build

ARG git_sha

ENV GIT_SHA=$git_sha

EXPOSE 7000

HEALTHCHECK --interval=5s --timeout=5s --start-period=15m --retries=12 \
    CMD curl -f http://localhost:7000/health_check || exit 1

CMD ["bash", "scripts/start.sh"]
