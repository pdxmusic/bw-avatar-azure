FROM node:20.12.2-alpine3.19

WORKDIR /app

COPY package*.json ./

RUN yarn install --immutable --immutable-cache --check-cache

COPY . .

EXPOSE 3400

CMD ["yarn", "start"]