FROM node:14.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM alpine:3.13

WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.10/main' >> /etc/apk/repositories && \
    apk update && \
    apk add libpq=11.12-r0 && \
    apk add postgresql=11.12-r0 && \
    apk add postgresql-client=11.12-r0 && \
    apk add postgresql-contrib=11.12-r0 && \
    apk add postgresql-libs=11.12-r0 && \
    apk add redis && \
    apk add bash && \
    apk add sudo && \
    apk add go-ipfs && \
    apk add rsyslog && \
    apk add nodejs # version 14.16.1

COPY . .

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

RUN bash scripts/init-db.sh

VOLUME "/file_storage"
ENV storagePath=/file_storage

EXPOSE 8000

ARG git_sha
ENV GIT_SHA=$git_sha

CMD ["sh", "scripts/start.sh"]
