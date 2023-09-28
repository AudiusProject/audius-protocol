FROM node:18-alpine AS base

# Everything is mounted into the container, see docker-compose.dev-tools.yml

RUN apk add --no-cache ffmpeg
RUN apk update

WORKDIR /app/dev-tools/commands

CMD sleep infinity
