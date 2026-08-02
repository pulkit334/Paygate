# Build from monorepo root:  docker build -f ApiGateway/Dockerfile -t <tag> .
FROM node:20-alpine AS builder
WORKDIR /app
# workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY Resilience/package.json ./Resilience/
COPY ApiGateway/package.json ./ApiGateway/
RUN npm ci --workspace ApiGateway --workspace Resilience --include-workspace-root
# sources
COPY Resilience ./Resilience
COPY ApiGateway ./ApiGateway
# build shared lib first, then gateway
RUN npm run build --workspace Resilience && npm run build --workspace ApiGateway

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY Resilience/package.json ./Resilience/
COPY ApiGateway/package.json ./ApiGateway/
RUN npm ci --omit=dev --workspace ApiGateway --workspace Resilience --include-workspace-root
# compiled output
COPY --from=builder /app/Resilience/dist ./Resilience/dist
COPY --from=builder /app/ApiGateway/dist ./ApiGateway/dist
# proto files where Grpc.ts expects them (projectRoot = ApiGateway/)
RUN mkdir -p /app/ApiGateway/backend/proto /app/ApiGateway/backend1/proto
COPY --from=builder /app/ApiGateway/proto/merchant.proto /app/ApiGateway/backend/proto/merchant.proto
COPY --from=builder /app/ApiGateway/proto/payment.proto /app/ApiGateway/backend1/proto/payment.proto
EXPOSE 6283
WORKDIR /app/ApiGateway
CMD ["node", "dist/server.js"]
