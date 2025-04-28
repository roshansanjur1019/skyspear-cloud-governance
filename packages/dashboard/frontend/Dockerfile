# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with specific fixes for the ajv issue
RUN npm install --legacy-peer-deps && \
    # Fix the ajv dependency issue
    npm install ajv@8.11.0 ajv-keywords@5.1.0 --legacy-peer-deps

# Copy the frontend application code
COPY . ./

# Add environment variables for build
ENV NODE_ENV=production
ENV CI=false
ENV PUBLIC_URL=/
ENV SKIP_PREFLIGHT_CHECK=true

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Create a simple nginx configuration
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