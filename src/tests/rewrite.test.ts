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

    it("returns the original question when there is no conversation history", async () => {
        const question = "What is linear algebra?";

        const result = await rewriteQuestion(
            question,
            []
        );

        expect(result).toBe(question);
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it("rewrites a follow-up question using conversation history", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: "Can you explain linear algebra more simply?",
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
                content: "The topics include probability, linear algebra, and vector calculus.",
            },
        ];

        const result = await rewriteQuestion(
            "Can you explain the second one more simply?",
            history
        );

        expect(result).toBe(
            "Can you explain linear algebra more simply?"
        );

        expect(mockCreate).toHaveBeenCalledOnce();
        const request = mockCreate.mock.calls[0][0];
        const messages = request.messages;
        expect(messages[1]).toEqual(history[0]);
        expect(messages[2]).toEqual(history[1]);
        expect(messages[3].content).toContain(
            "Can you explain the second one more simply?"
        );
    });

    it("keeps a standalone question unchanged when conversation history exists", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: "What is gradient descent?",
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

        expect(result).toBe(question);

        expect(mockCreate).toHaveBeenCalledOnce();
    });
});