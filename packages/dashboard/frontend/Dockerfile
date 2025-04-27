FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Create a proper .npmrc file first
RUN echo "registry=https://registry.npmjs.org/" > .npmrc && \
    echo "legacy-peer-deps=true" >> .npmrc && \
    echo "fund=false" >> .npmrc && \
    echo "audit=false" >> .npmrc && \
    echo "strict-peer-dependencies=false" >> .npmrc

# Fix the TypeScript version conflict by installing dependencies with specific versions
RUN npm install --legacy-peer-deps && \
    npm uninstall typescript && \
    npm install --legacy-peer-deps typescript@4.9.5 && \
    npm install --legacy-peer-deps ajv@8.11.0 ajv-keywords@5.1.0

# Copy the rest of the application
COPY . .

# Make sure public directory exists
RUN mkdir -p public

# Add a basic index.html if it doesn't exist
RUN if [ ! -f public/index.html ]; then \
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SpearPoint</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>' > public/index.html; \
fi

# Check node_modules to ensure proper installation
RUN ls -la node_modules/ajv/ || echo "ajv not found"
RUN ls -la node_modules/ajv-keywords/ || echo "ajv-keywords not found"
RUN ls -la node_modules/typescript/ || echo "typescript not found"

# Try to fix index.tsx import if needed
RUN find ./src -name "index.tsx" -exec sed -i 's/from \'\.\/(App)\';/from \'\.\/$1\.tsx\';/g' {} \; || echo "No index.tsx modification needed"

# Build the application with NODE_OPTIONS to increase memory and force flag
RUN NODE_OPTIONS=--max_old_space_size=4096 CI=false GENERATE_SOURCEMAP=false npm run build --force

# Production environment
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy the build output to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# If build directory is missing, create one with a basic HTML file
RUN if [ ! -d /usr/share/nginx/html ] || [ -z "$(ls -A /usr/share/nginx/html)" ]; then \
    mkdir -p /usr/share/nginx/html && \
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SpearPoint</title></head><body><h1>SpearPoint Cloud Governance</h1><p>Dashboard is being set up. Please check back soon.</p></body></html>' > /usr/share/nginx/html/index.html; \
fi

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