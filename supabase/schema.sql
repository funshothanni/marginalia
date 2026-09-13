-- Enable pgvector
create extension if not exists vector;

-- Store uploaded documents
create table if not exists documents (
    id serial primary key,
    file_name text not null,
    file_hash text not null,
    subject text not null,
    created_at timestamptz not null default now(),
    unique(subject, file_hash)
);

-- Store chunks and embeddings
create table if not exists note_chunks (
    id serial primary key,
    text text not null,
    source_doc varchar(255) not null,
    chunk_index integer not null,
    metadata jsonb not null,
    embedding vector(1536) not null,
    document_id integer not null references documents(id) on delete cascade
);

-- Search for the most relevant chunks within a subject
create or replace function match_note_chunks(
    query_embedding vector(1536),
    match_subject text,
    match_count int
)
returns table(
    id int,
    text text,
    source_doc varchar(255),
    metadata jsonb,
    similarity float
)
language sql
as $$
select
    note_chunks.id,
    note_chunks.text,
    note_chunks.source_doc,
    note_chunks.metadata,
    1 - (note_chunks.embedding <=> query_embedding) as similarity
from note_chunks
where note_chunks.metadata->>'subject' = match_subject
order by note_chunks.embedding <=> query_embedding
limit match_count;
$$;