FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_BASE_URL1=http://localhost:6283/api/v1
ARG VITE_BASE_URL2=http://localhost:6283/api/v2
ENV VITE_BASE_URL1=$VITE_BASE_URL1
ENV VITE_BASE_URL2=$VITE_BASE_URL2
COPY src/package*.json ./
RUN npm ci
COPY src/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
