FROM node:18.17-alpine

WORKDIR /verified_uploads

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]
