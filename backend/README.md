# Isidor Backend

This is the FastAPI backend for Isidor, an AI-driven life protocol system designed to optimize fitness, nutrition, sleep, cognitive performance, and overall well-being.

## Features

- RESTful API with OpenAPI documentation
- JWT-based authentication with refresh tokens
- PostgreSQL database with SQLAlchemy ORM
- Alembic for database migrations
- Secure health data storage with pgcrypto encryption
- Vector embeddings for health data with pgvector
- Retrieval-Augmented Generation (RAG) for personalized AI insights
- AI integration with Gemini API for health insights and protocol recommendations

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/isidor
   SECRET_KEY=your-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   EMBEDDING_DIMENSION=384
   SIMILARITY_THRESHOLD=0.7
   GEMINI_API_KEY=your-gemini-api-key
   GEMINI_MODEL=gemini-2.0-flash
   ```

4. Run database migrations:
   ```
   alembic upgrade head
   ```

5. Start the development server:
   ```
   uvicorn app.main:app --reload
   ```

## Docker Setup

You can also run the application using Docker Compose:

```
docker-compose up -d
```

This will start the PostgreSQL database with pgvector extension and the FastAPI application.

## Project Structure

- `app/`: Main application package
  - `api/`: API endpoints
  - `core/`: Core functionality (config, security)
  - `db/`: Database setup and session management
  - `models/`: SQLAlchemy ORM models
  - `schemas/`: Pydantic schemas for request/response validation
  - `services/`: Business logic
    - `ai.py`: Gemini AI integration for health insights and protocol recommendations
  - `utils/`: Utility functions
    - `embeddings.py`: Vector embedding generation
    - `rag.py`: Retrieval-Augmented Generation utilities

## Vector Embeddings and RAG

Isidor uses vector embeddings to enable semantic search and pattern recognition in health data:

- Health metrics are automatically embedded using sentence-transformers
- AI memory is stored with vector embeddings for contextual retrieval
- Similarity search allows finding patterns in health data
- RAG system combines relevant health data with AI insights for personalized recommendations

## Gemini AI Integration

Isidor leverages Google's Gemini AI to provide personalized health insights:

- Health insights based on user queries and health data
- Protocol recommendations tailored to user goals and available metrics
- Health trend analysis for specific metrics over time
- AI memory that maintains context across interactions
- Non-prescriptive, research-backed insights that respect user autonomy

## Testing

Run tests with pytest:
```
pytest
```

Test the Gemini API integration:
```
python -m tests.test_gemini
``` 