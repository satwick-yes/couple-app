FROM node:20-alpine

WORKDIR /app

# Copy everything from our repository into the Docker image
COPY . .

# Install dependencies at the root
RUN npm install

# Move into the web-backend folder
WORKDIR /app/apps/web-backend

# Expose the port our Express/Next.js server runs on
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"]
