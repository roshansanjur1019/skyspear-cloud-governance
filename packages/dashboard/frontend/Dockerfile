FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build the application
COPY . .
RUN npm run build

# Production image using nginx to serve static files
FROM nginx:alpine

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