FROM node:24-alpine

ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG WENYAN_CLI_VERSION=latest
ENV CONTAINERIZED=1
ENV CONTAINER_FILE_PATH=/mnt/host-downloads

WORKDIR /app

RUN npm config set registry ${NPM_REGISTRY}
RUN npm install -g "@wenyan-md/cli@${WENYAN_CLI_VERSION}" && npm cache clean --force

EXPOSE 3000

ENTRYPOINT ["wenyan"]

CMD ["--help"]
