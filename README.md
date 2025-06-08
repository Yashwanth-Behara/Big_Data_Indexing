# Big Data Indexing Project

A robust REST API implementation for handling structured JSON data with advanced features for data validation, caching, and search capabilities.

## Features

- **RESTful API Implementation**
  - CRUD operations (Create, Read, Delete)
  - JSON Schema validation for incoming payloads
  - Conditional read operations
  - Proper HTTP status codes and headers
  - Version control support

- **Data Storage & Caching**
  - Redis for key-value storage
  - Elasticsearch for advanced search capabilities
  - Efficient data retrieval and caching mechanisms

- **Security & Authentication**
  - JWT-based authentication
  - Express JWT middleware integration
  - Secure API endpoints

- **Message Queue Integration**
  - RabbitMQ (AMQP) support for asynchronous processing
  - Reliable message delivery

## Technologies Used

- **Backend Framework**: Express.js
- **Data Storage**: 
  - Redis (v4.7.0)
  - Elasticsearch (v7.10.0)
- **Message Queue**: RabbitMQ (AMQP)
- **Authentication**: JWT, JWKS-RSA
- **Validation**: AJV (JSON Schema Validator)
- **Other Dependencies**:
  - CORS support
  - Environment configuration (dotenv)
  - ETag support for caching
  - MD5 hashing

## Project Structure

```
├── config/         # Configuration files
├── controllers/    # Request handlers
├── elasticSearch/  # Elasticsearch integration
├── middlewares/    # Custom middleware functions
├── routes/         # API route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── server.js       # Application entry point
└── usecase.json    # Sample data structure
```

## API Features

1. **Data Validation**
   - JSON Schema validation for all incoming requests
   - Strict type checking and format validation
   - Custom validation rules

2. **Conditional Operations**
   - Support for conditional read operations
   - ETag-based caching
   - Optimistic concurrency control

3. **Data Model**
   - Flexible JSON structure support
   - Hierarchical data organization
   - Support for complex nested objects

## Getting Started

1. **Prerequisites**
   - Node.js
   - Redis server
   - Elasticsearch instance
   - RabbitMQ server

2. **Installation**
   ```bash
   npm install
   ```

3. **Configuration**
   - Set up environment variables
   - Configure Redis connection
   - Set up Elasticsearch indices
   - Configure RabbitMQ connection

4. **Running the Application**
   ```bash
   node server.js
   ```

## API Endpoints

The API supports the following operations:
- POST /api/v1/plans - Create new plan
- GET /api/v1/plans/:id - Retrieve plan by ID
- DELETE /api/v1/plans/:id - Delete plan by ID

## Data Model

The application implements a healthcare plan data model that includes:
- Plan cost shares
- Linked plan services
- Service details
- Cost share information
- Organization metadata

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License.