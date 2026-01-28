FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./

# Use npm ci if lockfile exists, otherwise npm install (production only)
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/dist ./dist
COPY public ./public

RUN mkdir -p logs

USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]