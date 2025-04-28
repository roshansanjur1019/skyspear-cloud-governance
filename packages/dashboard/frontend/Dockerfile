# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps
RUN npm install ajv@8.12.0 ajv-keywords@5.1.0 webpack@5.76.0 --legacy-peer-deps

# Copy all source files
COPY . .
RUN ls -l src/

# Fix the incorrect import in index.tsx
RUN sed -i "s|from '/App'|from './App'|g" src/index.tsx
RUN echo "Fixed import in index.tsx:"
RUN grep -n "import App" src/index.tsx

# Set build environment variables
ENV CI=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration and entrypoint
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV BACKEND_URL=http://api.spearpoint.local:3001

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]