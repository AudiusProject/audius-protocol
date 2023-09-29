FROM node:18.17-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache libc6-compat git
RUN apk update
RUN apk add --no-cache python3 py3-pip make g++

RUN npm install --production

COPY . .

CMD ["npm", "run", "start"]
