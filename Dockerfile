FROM node:alpine
EXPOSE 80
EXPOSE 22
EXPOSE 9229
WORKDIR /usr/backup-server
COPY package.json .
RUN yarn install\
        && yarn global add typescript\
        && yarn global add typeorm
RUN \
 apk add postgresql-client
COPY . .
RUN tsc
CMD ./wait-for-postgres.sh \
        && typeorm schema:sync \
        && node ${NODE_FLAGS} .
