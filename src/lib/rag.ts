import {embedText} from "./embed";
import {searchChunks} from "./db";
import {generateAnswer} from "./generate";
import type { SearchResult } from "@/types/searchResult";
import type { Message } from "@/types/message";
import { rewriteQuestion } from "./rewrite";

export async function askQuestion(question: string, subject: string, conversationHistory: Message[] = []): Promise<string> {
    const history = conversationHistory
        .slice(-10)
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));

    const retrievalQuestion = await rewriteQuestion(question, history);
    const embeddedQuestion = await embedText(retrievalQuestion);
    const result: SearchResult[] = await searchChunks(embeddedQuestion, subject, 5);
    const context = result
        .map((chunk) => chunk.text)
        .join("\n\n");
    return generateAnswer(question, context, history);
}