FROM node:18.17-slim as builder
RUN apt-get update && apt-get install -y python3 make gcc g++
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/dist /tmp/dist

RUN apk add --no-cache findutils coreutils
COPY ./scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
