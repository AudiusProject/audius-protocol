FROM node:18-alpine AS base

RUN apk add --no-cache ffmpeg bash
RUN apk update

WORKDIR /app/dev-tools/commands

COPY package*.json .
RUN --mount=type=cache,target=/root/.npm npm install --loglevel info

COPY . .

CMD sleep infinity
