FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_API_TIMEOUT_MS=10000
ARG VITE_API_RETRY_COUNT=1
ARG VITE_API_RETRY_DELAY_MS=300

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_TIMEOUT_MS=${VITE_API_TIMEOUT_MS}
ENV VITE_API_RETRY_COUNT=${VITE_API_RETRY_COUNT}
ENV VITE_API_RETRY_DELAY_MS=${VITE_API_RETRY_DELAY_MS}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Final stage: lightweight image that just holds the built files
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
# Default command: used by docker-compose to copy dist to shared volume
CMD ["sh", "-c", "cp -r /app/dist/. /dist-out/ && echo 'Done'"]