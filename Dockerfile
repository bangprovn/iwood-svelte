# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    BODY_SIZE_LIMIT=10M

RUN apk add --no-cache wget

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/src/lib/server/db ./src/lib/server/db

# Bundled WP mirror + seed scripts so an admin can manually populate
# /app/data/local.db from the container shell: `npm run db:seed:wp`.
# Refresh the mirror locally (`node scripts/wp-mirror.mjs`) and rebuild
# the image to ship new data.
COPY --from=build /app/dumps/wp.sqlite ./dumps/wp.sqlite
COPY --from=build /app/scripts ./scripts

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && node build"]
