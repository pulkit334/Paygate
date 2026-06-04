# Use a lightweight Node.js Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your Express app runs on
EXPOSE 3000

# Start the application using your development script
CMD ["npm", "run", "dev"]# Use a lightweight Node.js Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your Express app runs on
EXPOSE 3000

# Start the application using your development script
CMD ["npm", "run", "dev"]