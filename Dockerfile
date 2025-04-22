FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Build for production
RUN npm run build

# Stage 2: Run Stage (Different environments)
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Set default environment to development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Copy the correct environment file
COPY .env.${NODE_ENV} .env

EXPOSE 3000
CMD ["node", "dist/main.js"]
