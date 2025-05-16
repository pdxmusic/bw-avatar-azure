FROM node:20.12.2-alpine3.19

WORKDIR /app_tmp

COPY package*.json ./

RUN yarn install --immutable --immutable-cache --check-cache

COPY . .

RUN yarn build

RUN mkdir -p /app/dist && cp -r build/* ../app/dist

RUN rm -rf /app_tmp