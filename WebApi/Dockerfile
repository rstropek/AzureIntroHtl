# Use Node.js LTS as the base image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "./dist/app.js"]
