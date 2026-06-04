# Use a lightweight Node.js Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your worker service might use (if it has an API/Healthcheck)
EXPOSE 4000

# Start the application using your development script
CMD ["npm", "run", "dev"]