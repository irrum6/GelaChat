FROM node:14

WORKDIR /app

COPY . /app

RUN npm -v
RUN npm i

ENV PORT=8080
EXPOSE $PORT
CMD [ "npm", "start"]