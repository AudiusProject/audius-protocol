# syntax=docker/dockerfile:1
FROM alpine:3.16

RUN apk add --update nodejs npm

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000
CMD npm run graphql:start
