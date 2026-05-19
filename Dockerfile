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
COPY --from=build /app/scripts ./scripts

# WP mirror seed DB. Fetched at build time from R2 (or any HTTPS URL) so an
# admin can run `npm run db:seed:wp` from the container shell. The file is
# gitignored, so set WP_MIRROR_URL as a build arg in CI (Coolify: Build args).
# Use a presigned R2 URL if the bucket is private; refresh the URL whenever
# you redeploy. Leave unset to build without the seed file (e.g. local builds
# that don't need it baked in).
ARG WP_MIRROR_URL=""
RUN mkdir -p /app/dumps && \
    if [ -n "$WP_MIRROR_URL" ]; then \
        echo "Fetching wp.sqlite from $WP_MIRROR_URL" && \
        wget -q -O /app/dumps/wp.sqlite "$WP_MIRROR_URL" && \
        echo "wp.sqlite size: $(wc -c < /app/dumps/wp.sqlite) bytes"; \
    else \
        echo "WP_MIRROR_URL not set — skipping wp.sqlite bundle"; \
    fi

RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && node build"]
