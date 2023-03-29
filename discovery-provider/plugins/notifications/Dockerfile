FROM node:14.16-alpine
RUN apk add --no-cache --virtual .gyp python make g++ 

WORKDIR /notifications

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --verbose

COPY . .

RUN npm run build

ENV PATH="${PATH}:/notifications/node_modules/.bin"

# Run the command on container startup
CMD ["npm", "run", "dev"]
