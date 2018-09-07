FROM node:8.9

WORKDIR /usr/src/wemo_node

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081
CMD [ "npm", "start" ]