-- Enable pgvector
create extension if not exists vector;

-- Store uploaded documents
create table if not exists documents (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    file_name text not null,
    file_hash text not null,
    subject text not null,
    created_at timestamptz not null default now(),
    constraint documents_user_subject_file_hash_key
    unique(user_id, subject, file_hash)
);

-- Row Level Security for documents
alter table documents enable row level security;

drop policy if exists "Users can view their own documents" on documents;
create policy "Users can view their own documents"
on documents
for select
to authenticated
using (
    (select auth.uid()) = user_id
);

drop policy if exists "Users can create their own documents" on documents;
create policy "Users can create their own documents"
on documents
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
);

drop policy if exists "Users can delete their own documents" on documents;
create policy "Users can delete their own documents"
on documents
for delete
to authenticated
using (
    (select auth.uid()) = user_id
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

-- Row Level Security for note chunks
alter table note_chunks enable row level security;

drop policy if exists "Users can view chunks from their own documents" on note_chunks;
create policy "Users can view chunks from their own documents"
on note_chunks
for select
to authenticated
using (
    exists (
        select 1
        from documents
        where documents.id = note_chunks.document_id
        and documents.user_id = (select auth.uid())
    )
);

drop policy if exists "Users can create chunks for their own documents" on note_chunks;
create policy "Users can create chunks for their own documents"
on note_chunks
for insert
to authenticated
with check (
    exists (
        select 1
        from documents
        where documents.id = note_chunks.document_id
          and documents.user_id = (select auth.uid())
    )
);

-- Search for the most relevant chunks within a user's subject
create or replace function match_note_chunks(
    query_embedding vector(1536),
    match_subject text,
    match_user_id uuid,
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
    nc.id,
    nc.text,
    nc.source_doc,
    nc.metadata,
    1 - (nc.embedding <=> query_embedding) as similarity
from note_chunks nc
         join documents d
              on d.id = nc.document_id
where d.user_id = match_user_id
  and d.subject = match_subject
order by nc.embedding <=> query_embedding
limit match_count;
$$;

-- Store chat conversations
create table if not exists chats (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    subject text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Row Level Security for chats
alter table chats enable row level security;

drop policy if exists "Users can view their own chats" on chats;
create policy "Users can view their own chats"
on chats
for select
to authenticated
using (
    (select auth.uid()) = user_id
);

drop policy if exists "Users can create their own chats" on chats;
create policy "Users can create their own chats"
on chats
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
);

drop policy if exists "Users can update their own chats" on chats;
create policy "Users can update their own chats"
on chats
for update
to authenticated
using (
    (select auth.uid()) = user_id
)
with check (
    (select auth.uid()) = user_id
);

drop policy if exists "Users can delete their own chats" on chats;
create policy "Users can delete their own chats"
on chats
for delete
to authenticated
using (
    (select auth.uid()) = user_id
);

-- Store messages belonging to chats
create table if not exists messages (
    id serial primary key,
    chat_id integer not null references chats(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    created_at timestamptz not null default now()
);

-- Row Level Security for messages
alter table messages enable row level security;

drop policy if exists "Users can view messages from their own chats" on messages;
create policy "Users can view messages from their own chats"
on messages
for select
to authenticated
using (
    exists (
        select 1
        from chats
        where chats.id = messages.chat_id
            and chats.user_id = (select auth.uid())
    )
);

drop policy if exists "Users can create messages in their own chats" on messages;
create policy "Users can create messages in their own chats"
on messages
for insert
to authenticated
with check (
    exists (
        select 1
        from chats
        where chats.id = messages.chat_id
          and chats.user_id = (select auth.uid())
    )
);

