# This Dockerfile exists to allow compiled contracts to be used
# in multi stage builds for other services
# i.e.
# FROM audius-eth-contracts:latest as eth-contracts
# COPY --from=eth-contracts /usr/src/app/build/contracts/ ./build/contracts/

FROM node:10.16 as builder

COPY package*.json ./
COPY .npmrc ./
RUN npm install --loglevel verbose

FROM node:10.16-alpine
WORKDIR /usr/src/app
COPY --from=builder /node_modules ./node_modules
COPY . .

RUN ./node_modules/.bin/truffle compile

ARG git_sha
ENV GIT_SHA=$git_sha
