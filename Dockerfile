FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN npm run check && npm test && npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000 DATA_FILE=/data/mentormesh.json
WORKDIR /app
RUN addgroup -S mentormesh && adduser -S -G mentormesh -u 10001 mentormesh \
  && mkdir -p /data && chown mentormesh:mentormesh /data
COPY --from=build --chown=mentormesh:mentormesh /app/package.json ./
COPY --from=build --chown=mentormesh:mentormesh /app/node_modules ./node_modules
COPY --from=build --chown=mentormesh:mentormesh /app/dist ./dist
USER mentormesh
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O- http://127.0.0.1:3000/api/healthz || exit 1
CMD ["npm", "start"]
