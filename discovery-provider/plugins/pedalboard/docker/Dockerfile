FROM node:18.16-alpine AS base

ARG app_name

# set as env so we dont have to reset arg after multistage build
ENV APP_NAME=${app_name}

FROM base AS builder

RUN echo "building ${APP_NAME}"

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN yarn global add turbo

COPY . .
RUN turbo prune "--scope=${APP_NAME}" --docker

# I should be able to just use base and copy exactly what I need here
# Copying files doesn't work as expected though so just composing the build
# for now
FROM builder AS installer

WORKDIR /app

RUN apk add --no-cache libc6-compat git
RUN apk update
RUN apk add --no-cache python3 py3-pip make g++

# First install dependencies (as they change less often)
RUN yarn install

# # Build the project and its dependencies
# COPY --from=builder /app/out/full/ .
# COPY turbo.json turbo.json

RUN echo "installing deps for ${APP_NAME}"
RUN turbo run build "--filter=${APP_NAME}"...

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

WORKDIR /app/apps/${APP_NAME}

CMD yarn run start
