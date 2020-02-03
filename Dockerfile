FROM node:lts-alpine

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 64459
EXPOSE 64460
CMD [ "npm", "start" ]
