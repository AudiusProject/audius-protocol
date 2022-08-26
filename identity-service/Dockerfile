FROM node:14.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM node:14.16-alpine

WORKDIR /usr/src/app

RUN apk update && apk add rsyslog python3 python3-dev py3-pip curl bash

COPY --from=builder /app/node_modules ./node_modules

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY scripts/wait /usr/bin/wait

COPY . .

ARG git_sha
ARG audius_loggly_token
ARG audius_loggly_tags

ENV GIT_SHA=$git_sha
ENV logglyToken=$audius_loggly_token
ENV logglyTags=$audius_loggly_tags

EXPOSE 7000

HEALTHCHECK --interval=5s --timeout=5s \
    CMD curl -f http://localhost:7000/health_check || exit 1

CMD ["bash", "scripts/start.sh"]
