import {embedText} from "./embed";
import {searchChunks} from "./db";
import {generateAnswer} from "./generate";
import type { SearchResult } from "@/types/searchResult";
import type { Message } from "@/types/message";
import { rewriteQuestion } from "./rewrite";

// Nearest-neighbor search can return weak matches even for unrelated questions.
const MINIMUM_CHUNK_SIMILARITY = 0.35;
const NO_SUPPORTING_MATERIAL = "I couldn't find enough information in your uploaded materials to answer that.";

export async function askQuestion(userId: string, question: string, subject: string, conversationHistory: Message[] = []): Promise<string> {
    const history = conversationHistory
        .slice(-10)
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));

    const retrievalQuestion = await rewriteQuestion(question, history);
    const embeddedQuestion = await embedText(retrievalQuestion);
    const result: SearchResult[] = await searchChunks(userId, embeddedQuestion, subject, 5);
    const context = result
        .filter((chunk) => chunk.similarity >= MINIMUM_CHUNK_SIMILARITY)
        .map((chunk) => chunk.text.trim())
        .filter(Boolean)
        .join("\n\n");
    if (!context) {
        return NO_SUPPORTING_MATERIAL;
    }

    // Earlier answers can refer to deleted material. Use history to resolve the question only.
    return generateAnswer(retrievalQuestion, context);
}