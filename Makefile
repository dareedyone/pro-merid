up-deps:
	docker-compose up -d postgres redis mongo

# Stop all running containers
down:
	docker-compose down

# Start all services (including app)
up:
	docker-compose up -d

# Build all services
build:
	docker-compose build

# Watch logs for the app service
logs:
	docker-compose logs -f app

# Start NestJS app in dev mode (locally)
dev:
	pnpm start:dev

# Run migrations
migrate:
	pnpm mikro-orm migration:up

# Seed the database
seed:
	pnpm run seed
