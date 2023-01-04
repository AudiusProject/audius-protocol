FROM node:14

WORKDIR /usr/src/app

RUN apt update && apt install -y ffmpeg

COPY package*.json .
RUN --mount=type=cache,target=/root/.npm npm install --loglevel info --production

COPY . .
