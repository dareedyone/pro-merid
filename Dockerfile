FROM node:20-alpine AS builder
WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build for production
RUN pnpm run build

# Stage 2: Run Stage (Different environments)
FROM node:20-alpine
WORKDIR /usr/src/app

RUN npm install -g pnpm

# Set default environment to development, override with --build-arg
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Copy built files from builder
# Copy compiled output and installed deps
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

# Copy the correct .env file
COPY .env.${NODE_ENV} .env

# Expose NestJS default port
EXPOSE 3000

# Run app
CMD ["node", "dist/main.js"]


# ✅ Test it locally
# 1. Build with Docker:
# bash
# Copy
# Edit
# docker build -t my-nest-app-node20 .
# 2. Run the container:
# bash
# Copy
# Edit
# docker run -p 3000:3000 my-nest-app-node20
# Then visit http://localhost:3000 to test your app.

# ✅ If you're using npm instead of pnpm
# Just update these lines:

# dockerfile
# Copy
# Edit
# COPY package-lock.json package.json ./
# RUN npm ci
# And remove pnpm install or the global pnpm installation lines.

# ✅ Optional: Use .env automatically
# If you want to simplify managing multiple .env files, you can handle it in NestJS with @nestjs/config and use something like dotenv-flow.

# ✅ Bonus: Add --build-arg for different environments
# If you're deploying to production, you can build like:

# bash
# Copy
# Edit
# docker build --build-arg NODE_ENV=production -t my-nest-app-prod .
# And it will pick .env.production.
