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
COPY start_front.sh /tmp
EXPOSE 80

ENV GR_BACKEND_URL "http://smartsdk-back:8080/back-sdk"
ENV GR_ORION_URL "http://orion:1026"

CMD ["sh", "/tmp/start_front.sh"]
