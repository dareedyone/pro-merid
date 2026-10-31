# Specfynd Backend

Specfynd is a backend application for a community-oriented platform that brings together dating, friendships, and social interactions. This repository contains the server-side application built with NestJS and TypeScript.

The backend is organised into feature modules and shared infrastructure components to support authentication, user and profile management, social interactions, messaging, and other platform functionality.

Project status: Under active development. Some integrations and workflows may be incomplete. Review the relevant implementation and configuration before using the application in a production environment.

## Features

The codebase includes modules and services for:

- Authentication and users — authentication flows, user management, and access control.
- Dating and profiles — dating-related functionality and profile management.
- Friends and social interactions — friend-oriented functionality and connections.
- Chat and communication — messaging, WebSocket communication, and call-related services.
- Content and activity — content management and activity-related functionality.
- Location — location-related services.
- Subscriptions — subscription management and app-store-related webhook processing.
- Administration and support — administrative and support functionality.
- Background processing — queues, scheduled tasks, caching, and recurring jobs.
- API documentation — Swagger documentation exposed by the application.

The completeness and production readiness of individual features vary. In particular, payment verification and certain external-provider integrations require further implementation and validation.

## Technology Stack

The project uses:

- Runtime: Node.js
- Language: TypeScript
- Framework: NestJS
- Relational database: PostgreSQL, accessed through MikroORM
- Document database: MongoDB, accessed through Mongoose
- Caching and queues: Redis and Bull
- Real-time communication: Socket.IO and NestJS WebSockets
- API documentation: Swagger
- Testing: Jest
- Package manager: pnpm
- Containerisation: Docker

Additional dependencies support authentication, validation, scheduled tasks, notifications, file storage, and other integrations.

## Prerequisites

Install or provide:

- Node.js 20 or a compatible version supported by the project.
- pnpm.
- PostgreSQL.
- MongoDB.
- Redis.

External integrations may require additional configuration, depending on which features you intend to run.

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/dareedyone/pro-merid.git
cd pro-merid
```

### 2. Install dependencies

`pnpm install --frozen-lockfile`

### 3. Configure environment variables

Copy the example configuration to a local development environment file:

`cp .env.example .env.development`

Update the file with your local database connection details and appropriate development configuration.

Do not commit .env.development, .env.production, or other files containing local credentials or secrets.

The example environment file is a starting point, not a guarantee that every feature’s configuration is covered. Check the configuration factories and relevant services for additional variables required by the features you intend to use.

### 4. Start the application

Run the application in development mode:

`pnpm run start:dev`

The application defaults to port 3000. The port can be configured using the PORT environment variable.

The application requires its configured dependencies to be available. Database connection failures or missing configuration may prevent startup.

## API Documentation

When the application starts successfully, Swagger documentation is configured at:

`http://localhost:3000/api`

The API root is available at:

`http://localhost:3000/`

The root endpoint returns a basic application response; it is not a comprehensive health check for every dependency.

## Build and Run

Build the application:

`pnpm run build`

Run the compiled application:

`pnpm run start:prod`

Run the application in development mode with automatic reload:

`pnpm run start:dev`

## Testing

Run the unit test suite:

`pnpm run test`

Run tests serially:

`pnpm run test:serial`

Run tests with coverage reporting:

`pnpm run test:cov`

Run end-to-end tests:

`pnpm run test:e2e`

Some tests or application flows may require additional configuration or external dependencies. Review test output rather than assuming that every external integration is exercised by the test suite.

## Docker

The repository includes a Dockerfile for building the application image.

Build the image from the repository root:

`docker build -t specfynd-backend .`

The container expects its runtime configuration to be supplied through environment variables or an appropriate runtime environment file. Do not bake production credentials into the image.

For local development, provide the required configuration when starting the container. Ensure the relevant databases and other dependencies are reachable from the container.

## Security and Production Readiness

Before deploying the application for real users:

- Use strong, unique secrets and supply them through a secure configuration mechanism.
- Restrict CORS to the appropriate application origins.
- Verify authentication and authorisation rules for protected operations.
- Implement and validate the official verification mechanisms required by external subscription providers.
- Ensure subscription events are processed safely, including duplicate deliveries.
- Validate external-provider tokens and payloads before trusting them.
- Configure database access, network permissions, logging, and monitoring appropriately.

Features with placeholder verification or incomplete external integrations should not be treated as production-ready.

## Contributing

This repository is under active development. Changes should preserve existing functionality and include appropriate tests for new behaviour and bug fixes.

## Licence

See the repository’s LICENSE file if one is added. Until a licence is explicitly selected and published, do not assume that the source code is licensed for unrestricted reuse.