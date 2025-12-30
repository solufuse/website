# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
# CHANGED: 'npm install' instead of 'npm ci' to handle missing lockfile
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Serve ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install 'serve' globally to host static files
RUN npm install -g serve

# Copy only the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose Port 80
ENV PORT=80
EXPOSE 80

# Start command
CMD ["serve", "dist", "-l", "80"]
