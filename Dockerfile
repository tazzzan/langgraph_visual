# ==========================================
# STAGE 1: Build & Bundle Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable npm caching and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source files
COPY . .

# Compile TypeScript server and bundle frontend assets
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM node:22-alpine

WORKDIR /app

# Set default production environment
ENV NODE_ENV=production

# Copy package configurations
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled bundles and static assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start server using the production start script
CMD ["npm", "start"]
