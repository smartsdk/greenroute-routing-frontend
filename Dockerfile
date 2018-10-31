### STAGE 1: Build ###
FROM node:6.14.4 as builder
COPY package.json package-lock.json ./
RUN npm i && mkdir /ng-app && cp -R ./node_modules ./ng-app

WORKDIR /ng-app
COPY . .
RUN $(npm bin)/ng build --env prod

### STAGE 2: Setup ###
FROM nginx:1.13.6-alpine
COPY --from=builder /ng-app/dist /usr/share/nginx/html
EXPOSE 80
