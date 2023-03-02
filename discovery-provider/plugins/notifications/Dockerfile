FROM node:14.16-alpine

WORKDIR /notifications

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

RUN npm run build

# Run the command on container startup
CMD ["npm", "run", "dev"]
