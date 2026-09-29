import {createClient} from "@supabase/supabase-js";
import {EmbeddedChunk} from "@/types/embeddedChunk";
import {SearchResult} from "@/types/searchResult";
import { Chat } from "../types/chat";
import { Message } from "../types/message";

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

export async function searchChunks(userId: string, queryEmbedding: number[], subject: string, matchCount: number = 5): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc(
        "match_note_chunks",
        {
            query_embedding: queryEmbedding,
            match_subject: subject,
            match_user_id: userId,
            match_count: matchCount,
        }
    );

    if (error) {
        throw new Error(
            `Failed to retrieve chunks: ${error.message}`
        );
    }

    return data;
}

export async function findDocument(userId: string, subject: string, fileHash: string) {
    const { data, error } = await supabase
        .from("documents")
        .select("id, file_name")
        .eq("user_id", userId)
        .eq("subject", subject)
        .eq("file_hash", fileHash)
        .maybeSingle();

    if (error) {
        throw new Error(
            `Failed to check document: ${error.message}`
        );
    }

    return data;
}

export async function createDocument(userId: string, fileName: string, fileHash: string, subject: string) {
    const { data, error } = await supabase
        .from("documents")
        .insert({
            user_id: userId,
            file_name: fileName,
            file_hash: fileHash,
            subject,
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(
            `Failed to create document: ${error.message}`
        );
    }

    return data;
}

export async function deleteDocument(userId: string, documentId: number) {
    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(
            `Failed to delete document: ${error.message}`
        );
    }
}

//gets all the subjects in the database
export async function getSubjects(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("documents")
        .select("subject")
        .eq("user_id", userId);

    if (error) {
        throw new Error(
            `Failed to retrieve subjects: ${error.message}`
        );
    }

    return [
        ...new Set(
            data.map(row => row.subject)
        ),
    ];
}

//gets the document under a specific subject selected
export async function getDocumentsBySubject(userId: string, subject: string) {
    const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, created_at")
        .eq("user_id", userId)
        .eq("subject", subject)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(
            `Failed to retrieve documents: ${error.message}`
        );
    }

    return data;
}

export async function createChat(userId: string, subject: string, title: string = "New Chat"): Promise<Chat> {
    const { data, error } = await supabase
        .from("chats")
        .insert({
            user_id: userId,
            subject,
            title,
        })
        .select("id, title, subject, created_at, updated_at")
        .single();

    if (error) {
        throw new Error(
            `Failed to create chat: ${error.message}`
        );
    }

    return data;
}

export async function createMessage(userId: string, chatId: number, role: "user" | "assistant", content: string): Promise<Message> {
    const chat = await getChat(userId, chatId);

    if (!chat) {
        throw new Error("Chat not found");
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            chat_id: chatId,
            role,
            content,
        })
        .select("id, chat_id, role, content, created_at")
        .single();

    if (error) {
        throw new Error(
            `Failed to create message: ${error.message}`
        );
    }

    return data;
}

export async function getMessages(userId: string, chatId: number): Promise<Message[]> {
    const chat = await getChat(userId, chatId);

    if (!chat) {
        throw new Error("Chat not found");
    }

    const { data, error } = await supabase
        .from("messages")
        .select("id, chat_id, role, content, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(
            `Failed to retrieve messages: ${error.message}`
        );
    }

    return data;
}

export async function getChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
        .from("chats")
        .select("id, title, subject, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        throw new Error(
            `Failed to retrieve chats: ${error.message}`
        );
    }

    return data;
}

export async function updateChatTimestamp(userId: string, chatId: number): Promise<void> {
    const { error } = await supabase
        .from("chats")
        .update({
            updated_at: new Date().toISOString(),
        })
        .eq("id", chatId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(
            `Failed to update chat timestamp: ${error.message}`
        );
    }
}

export async function updateChatTitle(userId: string, chatId: number, title: string): Promise<void> {
    const { error } = await supabase
        .from("chats")
        .update({
            title,
        })
        .eq("id", chatId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(
            `Failed to update chat title: ${error.message}`
        );
    }
}

export async function getChat(userId: string, chatId: number): Promise<Chat | null> {
    const { data, error } = await supabase
        .from("chats")
        .select("id, title, subject, created_at, updated_at")
        .eq("id", chatId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error(
            `Failed to retrieve chat: ${error.message}`
        );
    }

    return data;
}

export async function deleteChat(userId: string, chatId: number): Promise<void> {
    const { error } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", userId);

    if (error) {
        throw new Error(
            `Failed to delete chat: ${error.message}`
        );
    }
}
