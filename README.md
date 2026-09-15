# Marginalia

A study application that uses Retrieval-Augmented Generation (RAG) to answer questions based on uploaded course materials.

Users can upload PDF documents, organize them by subject, and ask questions about their notes. The application retrieves relevant information from the uploaded documents and uses it as context to generate grounded answers.

## How It Works

1. A user uploads a PDF under a selected subject.
2. The application extracts the text and splits it into 300-word chunks with 50-word overlap.
3. Each chunk is converted into a 1,536-dimensional vector embedding using the OpenAI API.
4. Document content and embeddings are stored in Supabase using PostgreSQL and pgvector.
5. When a question is asked, subject-filtered vector search retrieves the 5 most relevant chunks.
6. The retrieved content is provided to the language model as context to generate an answer.

## Features

- 📄 Upload and process PDF course materials
- 📚 Organize documents by subject
- 💬 Ask questions about uploaded content
- 🔎 Retrieve relevant content using semantic search
- 🛡️ Prevent duplicate and incomplete document uploads

## Tech Stack

**Frontend:** Next.js, React, TypeScript  
**Backend:** Next.js API Routes, TypeScript  
**Database:** Supabase, PostgreSQL, pgvector  
**AI:** OpenAI API

## RAG Pipeline

```text
PDF Upload
    ↓
Text Extraction
    ↓
300-Word Chunks with 50-word overlap
    ↓
1,536-Dimensional Embeddings
    ↓
Supabase + pgvector
    ↓
Subject-Filtered Vector Search
    ↓
Top 5 Relevant Chunks
    ↓
LLM
    ↓
Answer
```

## Getting Started

### Prerequisites

To run the application, you will need:

- Node.js
- npm
- A Supabase project
- An OpenAI API key

### Installation

Clone the repository:

```bash
git clone https://github.com/funshothanni/marginalia.git
cd marginalia
```

Install the dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

### Database Setup

The application uses Supabase PostgreSQL with pgvector for storing and searching vector embeddings.

The database contains:

- `documents` —> stores uploaded document information, SHA-256 file hashes, and subjects.
- `note_chunks` —> stores extracted document chunks and their 1,536-dimensional vector embeddings.
- `match_note_chunks` —> PostgreSQL function that performs subject-filtered vector similarity search.

The complete database schema is available at:

```text
supabase/schema.sql
```

Create a Supabase project, open the **SQL Editor**, and run the contents of `supabase/schema.sql`. This will:

1. Enable pgvector.
2. Create the `documents` table.
3. Create the `note_chunks` table.
4. Create the `match_note_chunks` vector search function.

### Run the Application

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Upload a PDF, select its subject, and begin asking questions about the uploaded material.

### Run Tests

Run the automated test suite with:

```bash
npm test
```

## Acknowledgements

This project was developed collaboratively with the use of generative AI as a development aid for brainstorming, debugging, and learning. All implementation decisions, testing, and integration were reviewed and carried out by the development team.