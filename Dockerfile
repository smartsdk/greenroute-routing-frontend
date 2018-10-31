### STAGE 1: Build ###
FROM node:6.14.4 as builder

RUN mkdir /ng-app
COPY package.json /ng-app/package.json
COPY package-lock.json /ng-app/package-lock.json

WORKDIR /ng-app
RUN cd /ng-app
RUN npm i

COPY . /ng-app

RUN $(npm bin)/ng build --env prod

### STAGE 2: Setup ###
FROM nginx:1.13.6-alpine
COPY --from=builder /ng-app/dist /usr/share/nginx/html
EXPOSE 80
