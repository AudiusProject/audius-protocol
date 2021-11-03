FROM node:14.17
RUN apt-get install make

WORKDIR /home/node/app
COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 8000

ARG git_sha
ENV GIT_SHA=$git_sha

ENTRYPOINT npm run start
