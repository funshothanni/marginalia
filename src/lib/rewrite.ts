import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type ConversationMessage = {
    role: "user" | "assistant";
    content: string;
};

export async function rewriteQuestion(
    question: string,
    conversationHistory: ConversationMessage[]
): Promise<string> {
    if (conversationHistory.length === 0) {
        return question;
    }

    const messages = [
        {
            role: "system" as const,
            content: `
You rewrite follow-up questions into standalone questions for document retrieval.

Use the conversation history to resolve exactly what the student's current question refers to.

Rules:
- If the current question refers to something from the conversation, replace the reference with the specific topic, concept, or subject it refers to.
- Resolve references such as "that", "it", "this", "the first one", "the second one", "the last one", "what you said before", and similar phrases.
- When the student refers to an item by position, such as "the second one", identify the actual item from the previous conversation and include its name in the rewritten question.
- Do not leave unresolved phrases such as "the second one", "that concept", or "the topic" in the rewritten question when the conversation identifies what they mean.
- If the current question is already standalone and does not depend on the conversation history, return it unchanged.
- Only use the conversation history when necessary to resolve the meaning of the current question.
- Preserve the meaning and intent of the student's question.
- Do not answer the question.
- Do not add information that was not established by the conversation.
- Return only the rewritten standalone question.
`.trim(),
        },
        ...conversationHistory,
        {
            role: "user" as const,
            content: `Rewrite this question so it can be understood without the previous conversation:

${question}`,
        },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
    });

    return response.choices[0].message.content?.trim() ?? question;
}