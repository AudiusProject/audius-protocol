FROM node:18.17 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --loglevel verbose

FROM node:18.17-alpine

WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run typecheck
RUN npm run build

ARG git_sha
ENV GIT_SHA=$git_sha
