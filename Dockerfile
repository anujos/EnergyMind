# Multi-stage Dockerfile for Google Cloud Run ($300 Free Tier / Always Free Tier)
# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Lean Production Runtime (< 120MB image)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled backend bundle and static frontend
COPY --from=builder /app/dist ./dist

# Run as non-root user for security best-practices
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
