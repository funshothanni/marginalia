export type Message = {
    role: "user" | "assistant";
    text: string;
};

export type StudyDocument = {
    id: number;
    file_name: string;
    created_at: string;
};
export type Chat = {
    id: number;
    title: string;
    subject: string;
    created_at: string;
    updated_at: string;
};

export const SUBJECT_CODE_LENGTH = 4;
