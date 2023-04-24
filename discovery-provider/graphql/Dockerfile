# requires authentication to Dockerhub

FROM node:14.16 as builder
RUN apt-get install make
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm i

FROM node:14.16-alpine
WORKDIR /usr/src/app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

# ARGs can be optionally defined with --build-arg while doing docker build eg in CI and then set to env vars
ARG git_sha
ARG audius_loggly_disable
ARG audius_loggly_token
ARG audius_loggly_tags

ENV GIT_SHA=$git_shas
ENV audius_loggly_disable=$audius_loggly_disable
ENV audius_loggly_token=$audius_loggly_token
ENV audius_loggly_tags=$audius_loggly_tags

EXPOSE 6000

CMD ["npm", "run", "start"]
