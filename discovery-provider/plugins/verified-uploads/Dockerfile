FROM node:14.21.2-alpine

WORKDIR /verified_uploads

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]
