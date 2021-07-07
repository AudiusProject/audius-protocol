FROM node:14.16 as builder
RUN apt-get install make

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

FROM node:14.16-alpine

WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules

RUN apk update && \
    apk add postgresql && \
    apk add postgresql-contrib && \
    apk add redis && \
    apk add bash && \
    apk add sudo && \
    apk add go-ipfs --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

COPY . .

# Add the wait script to the image
# Script originally from https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /usr/bin/wait
COPY scripts/wait /usr/bin/wait
RUN chmod +x /usr/bin/wait

RUN ipfs init --profile server
RUN bash scripts/init-db.sh

VOLUME "/file_storage"
ENV storagePath=/file_storage

EXPOSE 8000

ARG git_sha
ENV GIT_SHA=$git_sha

#CMD ["sh", "-c", "/usr/bin/wait && exec node src/index.js"]
CMD ["sh", "scripts/start.sh"]
