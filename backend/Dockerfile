FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY src ./src

FROM node:20-alpine AS production
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p logs && chown -R node:node logs
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:5000/health || exit 1
CMD ["node", "src/app.js"]
