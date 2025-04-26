FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies with more verbose output and retry logic
RUN npm config set loglevel verbose && \
    npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image using nginx to serve static files
FROM nginx:alpine

# Install envsubst command (it's in the gettext package)
RUN apk add --no-cache gettext

# Copy nginx configuration template and entrypoint
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh

# Make entrypoint executable
RUN chmod +x /entrypoint.sh

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Set default backend URL (will be overridden by environment variable)
ENV BACKEND_URL=http://backend:3001

# Expose port 80
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]