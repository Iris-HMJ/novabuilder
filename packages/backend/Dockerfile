FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy package files
COPY packages/backend/package*.json ./
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/backend/ ./

# Build
RUN pnpm build

# Expose port
EXPOSE 4000

# Start
CMD ["node", "dist/main.js"]
