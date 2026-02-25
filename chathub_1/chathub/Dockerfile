# ─── Stage 1: Build the frontend ───
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ─── Stage 2: Production server ───
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend + server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Non-root user for security
RUN addgroup -g 1001 -S chathub && \
    adduser -S chathub -u 1001 -G chathub
USER chathub

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
