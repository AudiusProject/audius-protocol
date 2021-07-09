FROM node:10.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM alpine:3.10

WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules

RUN apk update && \
    apk add postgresql && \
    apk add postgresql-contrib && \
    apk add redis && \
    apk add bash && \
    apk add sudo && \
    apk add nodejs

COPY . .

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

RUN bash scripts/init-db.sh

EXPOSE 7000

ARG git_sha
ENV GIT_SHA=$git_sha

CMD ["sh", "scripts/start.sh"]
