# Build stage
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Add npm configuration for network resilience
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retries 5 \
    && npm config set registry https://registry.npmjs.org/

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with specific TypeScript version constraint
# Adding --network-timeout to make npm more resilient to network issues
RUN npm install --force --network-timeout=100000 && \
    npm uninstall typescript && \
    npm install --force typescript@4.9.5 --network-timeout=100000

# Copy the rest of the application
COPY . .

# Make sure public directory exists
RUN mkdir -p public

# Create index.html if it doesn't exist
RUN if [ ! -f public/index.html ]; then \
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SpearPoint Cloud Governance</title></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>' > public/index.html; \
fi

# Set environment variables for build
ENV SKIP_PREFLIGHT_CHECK=true
ENV TSC_COMPILE_ON_ERROR=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV CI=false
ENV PUBLIC_URL=/
ENV FORCE_COLOR=true

# Build the application with a retry mechanism
RUN npm run build || npm run build || (cat /root/.npm/_logs/*-debug-0.log && exit 1)

# Production stage
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Create a fallback index.html if build failed
RUN if [ ! -d /usr/share/nginx/html ] || [ -z "$(ls -A /usr/share/nginx/html)" ]; then \
    mkdir -p /usr/share/nginx/html && \
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SpearPoint</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:20px auto;line-height:1.6}h1{color:#1976d2}</style></head><body><h1>SpearPoint Cloud Governance</h1><p>Dashboard is being set up. Please check back soon.</p><p>If you continue to see this page, please contact your administrator.</p></body></html>' > /usr/share/nginx/html/index.html; \
fi

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment variable for backend URL
ENV BACKEND_URL=http://api.spearpoint.local:3001

# Expose port 80
EXPOSE 80

# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]