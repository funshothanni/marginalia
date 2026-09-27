export type Message = {
    id: number;
    chat_id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
};