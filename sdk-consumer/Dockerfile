FROM node:14.16 as builder

WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel verbose

COPY . .

CMD npm run start