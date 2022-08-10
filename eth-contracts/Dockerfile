# This Dockerfile exists to allow compiled contracts to be used
# in multi stage builds for other services
# i.e.
# FROM audius-eth-contracts:latest as eth-contracts
# COPY --from=eth-contracts /usr/src/app/build/contracts/ ./build/contracts/

FROM node:14.17.5 as builder

COPY package*.json ./
RUN npm install --loglevel verbose

FROM node:14.17.5-slim
WORKDIR /usr/src/app
COPY --from=builder /node_modules ./node_modules
COPY . .

RUN npx truffle compile

ARG git_sha
ENV GIT_SHA=$git_sha
