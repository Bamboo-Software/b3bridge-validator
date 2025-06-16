# Builder stage
FROM node:22-slim AS builder
COPY package.json yarn.lock ./

RUN yarn install --ignore-scripts

COPY . ./

RUN yarn build

# Installer stage
FROM node:22-slim AS installer
COPY package.json yarn.lock ./

RUN yarn install --prod --ignore-scripts

# Runtime stage
FROM node:22-slim AS runtime

ARG PORT=3000

WORKDIR /app

COPY --from=builder dist /app/dist
COPY --from=builder data /app/data
COPY --from=builder public /app/public
COPY --from=installer node_modules /app/node_modules

COPY package.json ./

EXPOSE $PORT

CMD [ "node", "dist/main.js" ]