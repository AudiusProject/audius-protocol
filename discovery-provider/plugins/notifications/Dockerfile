FROM node:16-slim

WORKDIR /notifications

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

RUN npm run build


# Run the command on container startup
CMD ["npm", "run", "dev"]
