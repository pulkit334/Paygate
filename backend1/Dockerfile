FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY proto ./proto
EXPOSE 50051
CMD ["npx", "tsx", "server.ts"]
