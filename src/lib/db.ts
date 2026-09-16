import {createClient} from "@supabase/supabase-js";
import {EmbeddedChunk} from "@/types/embeddedChunk";
import {SearchResult} from "@/types/searchResult";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

export async function insertChunks(chunks: EmbeddedChunk[], documentId: number) {
    if (chunks.length === 0) {
        return [];
    }
    const rows = chunks.map(chunk => {
        return {
            text: chunk.text,
            source_doc: chunk.sourceDoc,
            chunk_index: chunk.chunkIndex,
            metadata: chunk.metadata,
            embedding: chunk.embedding,
            document_id: documentId,
        };
    });

    const {data, error} = await supabase
        .from("note_chunks")
        .insert(rows)
        .select();

    if (error) {
        throw new Error(`Failed to insert chunks: ${error.message}`)
    }
    return data;
}

export async function searchChunks(queryEmbedding: number[], subject: string, matchCount: number = 5): Promise<SearchResult[]> {
    const {data, error} = await supabase.rpc("match_note_chunks", {
        query_embedding: queryEmbedding,
        match_subject: subject,
        match_count: matchCount,
    });

    if (error) {
        throw new Error(`Failed to retrieve chunks: ${error.message}`);
    }
    return data;
}

export async function findDocument(subject: string, fileHash: string) {
    const {data, error} = await supabase
        .from("documents")
        .select("id, file_name")
        .eq("subject", subject)
        .eq("file_hash", fileHash)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to check document: ${error.message}`);
    }
    return data;
}

export async function createDocument(fileName: string, fileHash: string, subject: string) {
    const {data, error} = await supabase
        .from("documents")
        .insert({
            file_name: fileName,
            file_hash: fileHash,
            subject: subject,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(`Failed to create document: ${error.message}`);
    }

    return data;
}

export async function deleteDocument(documentId: number) {
    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

    if (error) {
        throw new Error(
            `Failed to delete document: ${error.message}`
        );
    }
}

//gets all the subjects in the database
export async function getSubjects(): Promise<string[]> {
    const { data, error } = await supabase
    .from("documents")
    .select("subject");

    if (error){
        throw new Error(`Failed to retrieve subjects: ${error.message}`);
    }

    return [...new Set(
        data.map(row => row.subject)
    )];
}

//gets the document under a specific subject selected
export async function getDocumentsBySubject(subject: string) {
    const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, created_at")
        .eq("subject", subject)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(
            `Failed to retrieve documents: ${error.message}`
        );
    }
    return data;
}