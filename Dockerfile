# syntax=docker/dockerfile:1
# Reproducible production image (native deps: bcrypt, better-sqlite3)
FROM node:25-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY server.js ./
COPY backend ./backend
COPY frontend ./frontend
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
ENV LISTEN_HOST=0.0.0.0
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/backend/data \
  && chown -R node:node /app
USER node
EXPOSE 8788
CMD ["node", "server.js"]
