FROM node:14.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM node:14.16-alpine

WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

ARG git_sha
ENV GIT_SHA=$git_sha
