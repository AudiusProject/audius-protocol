FROM node:14.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM alpine:3.13

WORKDIR /usr/src/app

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.10/main' >> /etc/apk/repositories && \
    apk update && \
    apk add bash && \
    apk add nodejs && \
    apk add redis && \
    apk add sudo && \
    apk add docker && \
    apk add go-ipfs && \
    apk add rsyslog && \
    apk add libpq=11.12-r0 && \
    apk add postgresql=11.12-r0 && \
    apk add postgresql-client=11.12-r0 && \
    apk add postgresql-contrib=11.12-r0 && \
    apk add postgresql-libs=11.12-r0

# versions
# bash 5.1.0-r0
# docker 20.10.3-r1
# go-ipfs 0.8.0-r0
# nodejs 14.17.4-r0
# redis 6.0.14-r0
# sudo 1.9.5p2-r0
# rsyslog 8.2012.0-r1

# libpq 11.12-r0
# postgresql 11.12-r0
# postgresql-client 11.12-r0
# postgresql-contrib 11.12-r0
# postgresql-libs 11.12-r0

COPY --from=builder /app/node_modules ./node_modules
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

# CMD ["sh", "-c", "/usr/bin/wait && exec node src/index.js"]
CMD ["bash", "scripts/start.sh"]
