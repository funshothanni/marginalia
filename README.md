# Marginalia

Marginalia is an AI-powered study application that uses Retrieval-Augmented Generation (RAG) to answer questions based on a user's uploaded course materials.

Users can upload PDF documents, organize their materials by subject, maintain persistent conversations, and ask questions grounded in their notes. Marginalia retrieves relevant information from uploaded documents and provides it as context to a language model to generate answers.

## How It Works

1. A user authenticates with their Marginalia account.
2. The user uploads a PDF under a selected subject.
3. The application extracts the document text and chunks it.
4. Each chunk is embedded.
5. Document metadata, chunks, and embeddings are stored in Supabase using PostgreSQL and pgvector.
6. When a question is asked, subject-filtered vector search retrieves the 5 most relevant chunks belonging to the authenticated user.
8. The retrieved content is provided to the language model as context.
9. The generated response is stored as part of the user's persistent chat history.

## Features

- 📄 Upload and process PDF course materials
- 📚 Organize documents by subject
- 💬 Create and maintain persistent chat conversations
- 🧠 Ask context-aware follow-up questions
- 🔎 Retrieve relevant content using semantic vector search
- 🔐 User authentication and data ownership
- 🛡️ PostgreSQL Row Level Security (RLS)
- 🔒 User-scoped document, chat, message, and RAG retrieval
- ♻️ Prevent duplicate document uploads using SHA-256 hashing
- 🧹 Clean up incomplete document ingestion when processing fails
- 🧪 Automated testing with Vitest

## Tech Stack

**Frontend:** Next.js, React, TypeScript  
**Backend:** Next.js API Routes, TypeScript  
**Database:** Supabase, PostgreSQL, pgvector  
**Authentication:** Supabase Auth  
**AI:** OpenAI API  
**Testing:** Vitest

## Architecture

Marginalia separates application data by authenticated user.

```text
Authenticated User
        │
        ├── Documents
        │      └── Note Chunks + Embeddings
        │
        └── Chats
               └── Messages
```

Application-level ownership checks and PostgreSQL Row Level Security are used together to prevent users from accessing data belonging to other accounts.

## RAG Pipeline

```text
PDF Upload
    ↓
Text Extraction
    ↓
300-Word Chunks with 50-Word Overlap
    ↓
1,536-Dimensional Embeddings
    ↓
Supabase PostgreSQL + pgvector
    ↓
User + Subject-Filtered Vector Search
    ↓
Top 5 Relevant Chunks
    ↓
Conversation History
    ↓
LLM
    ↓
Grounded Answer
    ↓
Persistent Chat History
```

For follow-up questions, Marginalia can use recent conversation history to rewrite context-dependent questions into standalone queries before vector retrieval.

For example:

```text
User: What is classical conditioning?

User: Who developed it?
              ↓
Retrieval query:
"Who developed classical conditioning?"
```

This improves retrieval while preserving the user's original question for answer generation.

## Security

Marginalia uses multiple layers of authorization rather than relying solely on application-level filtering.

### Authentication

Supabase Auth identifies the user associated with each request.

Protected API routes reject unauthenticated requests before accessing user data.

### Data Ownership

Documents and chats are directly associated with a Supabase user.

Messages inherit ownership through their parent chat:

```text
User
 ↓
Chat
 ↓
Message
```

Document chunks inherit ownership through their parent document:

```text
User
 ↓
Document
 ↓
Note Chunk
```

### Row Level Security

PostgreSQL Row Level Security policies restrict access to user-owned data across:

- `documents`
- `note_chunks`
- `chats`
- `messages`

The server-side database layer uses the authenticated Supabase session so these policies are enforced by PostgreSQL.

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── chats/
│   │   ├── documents/
│   │   ├── messages/
│   │   ├── query/
│   │   ├── subjects/
│   │   └── upload/
│   │
│   ├── app/
│   │   └── page.tsx
│   │
│   └── page.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── auth.ts
│   ├── chunk.ts
│   ├── db.ts
│   ├── embed.ts
│   ├── extract.ts
│   ├── generate.ts
│   ├── hash.ts
│   ├── ingest.ts
│   ├── rag.ts
│   └── rewrite.ts
│
├── tests/
└── types/

supabase/
└── schema.sql
```

## Getting Started

### Prerequisites

To run Marginalia locally, you will need:

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

## Environment Variables

Create a `.env.local` file in the root of the project.

```env
OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit `.env.local` or API credentials to source control.

## Database Setup

Marginalia uses Supabase PostgreSQL and pgvector for application data and vector similarity search.

The primary database resources are:

- `documents` — stores uploaded document metadata, SHA-256 hashes, subjects, and document ownership.
- `note_chunks` — stores extracted document chunks and 1,536-dimensional embeddings.
- `chats` — stores persistent user conversations.
- `messages` — stores user and assistant messages belonging to chats.
- `match_note_chunks` — PostgreSQL function used for user-scoped, subject-filtered vector similarity search.

The complete database schema is located at:

```text
supabase/schema.sql
```

Create a Supabase project, open the **SQL Editor**, and run the schema.

The schema configures the database tables, pgvector support, vector retrieval function, relationships, and Row Level Security policies required by Marginalia.

## Running the Application

Start the development server:

```bash
npm run dev
```

The application is available at:

```text
http://localhost:3000
```

The main study interface is located at:

```text
http://localhost:3000/app
```

Authentication routes are being separated from the main application interface.

## Testing

Run the complete automated test suite:

```bash
npm test -- --run
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run ESLint:

```bash
npm run lint
```

The project currently includes automated tests covering the RAG pipeline, document ingestion, database operations, API routes, chat persistence, authentication boundaries, and user-scoped retrieval.

## Current Development

Marginalia is under active development.

Current development focuses include:

- Authentication UI and account flows
- Protected application routing
- Sign-in, sign-up, and logout flows
- Production deployment
- AI usage tracking
- User credit and billing infrastructure

## Acknowledgements

Marginalia is developed collaboratively with generative AI used as a development aid for brainstorming, debugging, learning, and implementation support.

Architecture decisions, code integration, testing, and project development are reviewed and carried out by the development team.