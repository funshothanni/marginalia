import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
}));

vi.mock("openai", () => ({
    OpenAI: class {
        chat = {
            completions: {
                create: mockCreate,
            },
        };
    },
}));

import { rewriteQuestion } from "../lib/rewrite";

describe("rewriteQuestion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("classifies a first-turn overview and preserves the original wording", async () => {
        const question = "What are the main ideas across all my PDFs?";
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ question: "Summarize my uploaded materials.", scope: "course_overview" }) } }],
        });

        await expect(rewriteQuestion(question, [])).resolves.toEqual({
            question,
            scope: "course_overview",
        });
        expect(mockCreate).toHaveBeenCalledOnce();
    });

    it("requests a structured rewrite that resolves the topic without carrying over a prior claim", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: JSON.stringify({ question: "Can you explain linear algebra more simply?", scope: "targeted" }),
                    },
                },
            ],
        });

        const history = [
            {
                role: "user" as const,
                content: "What topics are covered?",
            },
            {
                role: "assistant" as const,
                content: "1. Probability\n2. Linear algebra. A matrix is always invertible.",
            },
        ];

        const result = await rewriteQuestion(
            "Thanks, can you explain the second one more simply?",
            history
        );

        expect(result).toEqual({
            question: "Can you explain linear algebra more simply?",
            scope: "targeted",
        });

        expect(mockCreate).toHaveBeenCalledOnce();
        const request = mockCreate.mock.calls[0][0];
        expect(request.response_format).toMatchObject({
            type: "json_schema",
            json_schema: {
                strict: true,
                schema: { required: ["question", "scope", "lookupPhrase", "documentReference"], additionalProperties: false },
            },
        });
        const messages = request.messages;
        expect(messages[0].content).toContain('Result: {"question":"Can you explain linear algebra more simply?","scope":"targeted","lookupPhrase":null,"documentReference":null}');
        expect(messages[0].content).toContain("Leave the earlier assistant's factual claim out of the question.");
        expect(messages[1]).toEqual(history[0]);
        expect(messages[2]).toEqual(history[1]);
        expect(messages[3].content).toContain(
            "Thanks, can you explain the second one more simply?"
        );
    });

    it("keeps a standalone question unchanged when conversation history exists", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: JSON.stringify({ question: "What is gradient descent?", scope: "targeted" }),
                    },
                },
            ],
        });

        const history = [
            {
                role: "user" as const,
                content: "What is linear algebra?",
            },
            {
                role: "assistant" as const,
                content: "Linear algebra studies vectors and matrices.",
            },
        ];

        const question = "What is gradient descent?";

        const result = await rewriteQuestion(
            question,
            history
        );

        expect(result).toEqual({ question, scope: "targeted" });

        expect(mockCreate).toHaveBeenCalledOnce();
    });

    it.each([
        { name: "empty content", response: { choices: [{ message: { content: "" } }] } },
        { name: "whitespace content", response: { choices: [{ message: { content: " \n\t " } }] } },
        { name: "missing content", response: { choices: [{ message: {} }] } },
        { name: "null content", response: { choices: [{ message: { content: null } }] } },
        { name: "malformed JSON", response: { choices: [{ message: { content: "targeted" } }] } },
        { name: "null JSON", response: { choices: [{ message: { content: "null" } }] } },
        { name: "unknown scope", response: { choices: [{ message: { content: JSON.stringify({ question: "Summarize the notes.", scope: "unknown" }) } }] } },
        { name: "missing question", response: { choices: [{ message: { content: JSON.stringify({ scope: "course_overview" }) } }] } },
        { name: "non-string question", response: { choices: [{ message: { content: JSON.stringify({ question: 42, scope: "targeted" }) } }] } },
        { name: "blank question", response: { choices: [{ message: { content: JSON.stringify({ question: " ", scope: "targeted" }) } }] } },
        { name: "empty choices", response: { choices: [] } },
    ])("preserves the question for $name", async ({ response }) => {
        mockCreate.mockResolvedValueOnce(response);
        const question = "Can you explain the second one more simply?";

        await expect(rewriteQuestion(question, [
            { role: "assistant", content: "1. Probability\n2. Linear algebra" },
        ])).resolves.toEqual({ question, scope: "targeted" });
    });

    it("preserves summary intent and marks history as unverified in the instructions", async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ question: "Summarize my uploaded materials.", scope: "course_overview" }) } }],
        });

        await rewriteQuestion("Summarize my uploaded materials.", [
            { role: "assistant", content: "Previously we discussed linear algebra." },
        ]);

        const prompt = mockCreate.mock.calls[0][0].messages[0].content;
        expect(prompt).toContain("Conversation history identifies references; it is not verified document evidence.");
        expect(prompt).toContain("Earlier assistant answers may contain mistakes.");
        expect(prompt).toContain("not to establish factual premises");
        expect(prompt).toContain("Preserve the requested operation");
        expect(prompt).toContain("Do not turn a request to summarize uploaded materials into a question about one previously discussed topic");
        expect(prompt).toContain("preserve the ambiguity instead of inventing a topic");
    });

    it.each([
        { question: "What is the oxbow method?", phrase: "oxbow", accepted: "oxbow" },
        { question: "Explain spaced repetition.", phrase: "spaced repetition", accepted: "spaced repetition" },
        { question: "What is oxbowish?", phrase: "oxbow", accepted: undefined },
        { question: "Explain that again.", phrase: "invented", accepted: undefined },
    ])("validates the lookup phrase for $question", async ({ question, phrase, accepted }) => {
        mockCreate.mockResolvedValueOnce({
            choices: [{ message: { content: JSON.stringify({ question, scope: "targeted", lookupPhrase: phrase }) } }],
        });

        const result = await rewriteQuestion(question, []);
        expect(result.lookupPhrase).toBe(accepted);
    });

    it("propagates provider failures instead of hiding them as a fallback", async () => {
        mockCreate.mockRejectedValueOnce(new Error("Provider unavailable"));

        await expect(rewriteQuestion("Explain that.", [
            { role: "user", content: "What is linear algebra?" },
        ])).rejects.toThrow("Provider unavailable");
    });
});
