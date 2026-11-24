import { describe, expect, it, vi } from "vitest";
import { getConversationalReply } from "../lib/conversation";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("openai", () => ({
    OpenAI: class {
        chat = { completions: { create: mockCreate } };
    },
}));

describe("getConversationalReply", () => {
    it("lets the model respond to the student's answer to a check-in", async () => {
        const history = [
            { id: 1, chat_id: 7, role: "user" as const, content: "How are you?", created_at: "" },
            { id: 2, chat_id: 7, role: "assistant" as const, content: "How's studying going?", created_at: "" },
        ];
        const question = "Studying isn't so bad.";
        const reply = "Glad it's going okay. What have you been working on?";
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ intent: "social", reply }) } }],
        });

        await expect(getConversationalReply(question, history)).resolves.toBe(reply);

        const messages = mockCreate.mock.lastCall?.[0].messages;
        expect(messages?.slice(1)).toEqual([
            { role: "user", content: "How are you?" },
            { role: "assistant", content: "How's studying going?" },
            { role: "user", content: question },
        ]);
    });

    it.each(["What are the main ideas across all my PDFs?", "Thanks, can you explain indexing?"])(
        "routes a study request to document retrieval: %s",
        async (question) => {
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify({ intent: "substantive", reply: null }) } }],
            });

            await expect(getConversationalReply(question, [])).resolves.toBeNull();

            const prompt = mockCreate.mock.lastCall?.[0].messages[0].content;
            expect(prompt).toContain("Use substantive for any request for information");
            expect(prompt).toContain("If a message combines small talk with a task");
        }
    );

    it("routes malformed output to document retrieval", async () => {
        mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: "invalid" } }] });

        await expect(getConversationalReply("Hello", [])).resolves.toBeNull();
    });

    it("uses the app's own reply for a genuine capabilities question", async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ intent: "capabilities", reply: null }) } }],
        });

        await expect(getConversationalReply("Can you summarize PDFs?", []))
            .resolves.toBe("I can help you study your uploaded PDFs. Select a course and ask me about its materials.");
    });
});
