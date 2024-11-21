FROM node:18.16-alpine
RUN apk add --no-cache --virtual .gyp python3 make g++ 

WORKDIR /notifications

RUN apk add --no-cache python3 py3-pip build-base

COPY package*.json ./
RUN npm i

COPY . .

RUN npm run build

ENV PATH="${PATH}:/notifications/node_modules/.bin"

# Run the command on container startup
CMD ["npm", "run", "start"]
