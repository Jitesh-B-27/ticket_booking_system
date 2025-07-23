# Base image: official Node.js
FROM node:20

#Set working directory inside container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy your app code
COPY . .

# Expose port (matches app.js PORT)
EXPOSE 5000

# Start the server
CMD ["npm", "run", "dev"] 