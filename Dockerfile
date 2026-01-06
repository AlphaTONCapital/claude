FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]