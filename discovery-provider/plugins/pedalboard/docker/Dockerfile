FROM node:20-alpine AS base

ARG app_name

# set as env so we dont have to reset arg after multistage build
ENV APP_NAME=${app_name}

FROM base AS builder

RUN echo "building ${APP_NAME}"

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN yarn global add turbo
COPY "../apps/${APP_NAME}" .
RUN turbo prune "--scope=${APP_NAME}" --docker
