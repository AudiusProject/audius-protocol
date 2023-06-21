FROM node:16.20-alpine
RUN apk add --no-cache --virtual .gyp python make g++ 

WORKDIR /notifications

RUN apk add --no-cache python3 py3-pip build-base

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm i --verbose

COPY . .

RUN npm run build

ENV PATH="${PATH}:/notifications/node_modules/.bin"

# Run the command on container startup
CMD ["npm", "run", "dev"]
