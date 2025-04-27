FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Install specific npm version known to be more stable with this project
RUN npm install -g npm@8.19.4

# Copy package files first (for better layer caching)
COPY package*.json ./

# Clean npm cache and use clean install with additional flags
RUN npm cache clean --force && \
    npm install --no-fund --no-audit --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production environment
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy the build output to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment variable for backend URL with a default value
ENV BACKEND_URL=http://api:3001

# Expose port 80
EXPOSE 80

# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]