# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package files first
COPY packages/dashboard/frontend/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the frontend application code
COPY packages/dashboard/frontend/ ./

# Add environment variables for build
ENV NODE_ENV=production
ENV CI=false
ENV PUBLIC_URL=/

# Print the directory structure before building
RUN echo "Directory structure before build:" && ls -la

# Build the application
RUN npm run build && echo "Build completed successfully"

# Print the directory structure after building
RUN echo "Directory structure after build:" && ls -la
RUN echo "Build directory contents:" && ls -la build || echo "Build directory not found"

# Production stage
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Create a test file to verify nginx is serving files
RUN echo '<html><body><h1>SpearPoint Test Page</h1><p>If you see this page, nginx is working correctly.</p></body></html>' > /usr/share/nginx/html/test.html

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Debug: Check what was copied
RUN echo "Files in /usr/share/nginx/html:" && ls -la /usr/share/nginx/html

# Create a simple nginx configuration that will work for React routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://api.spearpoint.local:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]