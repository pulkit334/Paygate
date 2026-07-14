FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/backend/proto /app/backend1/proto
COPY --from=builder /app/proto/merchant.proto /app/backend/proto/merchant.proto
COPY --from=builder /app/proto/payment.proto /app/backend1/proto/payment.proto
EXPOSE 6283
CMD ["node", "dist/server.js"]
