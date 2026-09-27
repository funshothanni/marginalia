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

import { generateAnswer } from "../lib/generate";

describe("generateAnswer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("includes conversation history in the OpenAI request", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: "Here is an example.",
                    },
                },
            ],
        });

        const history = [
            {
                role: "user" as const,
                content: "What is classical conditioning?",
            },
            {
                role: "assistant" as const,
                content: "Classical conditioning is learning through association.",
            },
        ];

        const answer = await generateAnswer(
            "Can you give me an example of that?",
            "Classical conditioning involves learning through associations.",
            history
        );

        expect(answer).toBe("Here is an example.");
        expect(mockCreate).toHaveBeenCalledOnce();
        const request = mockCreate.mock.calls[0][0];
        const messages = request.messages;

        expect(messages[1]).toEqual({
            role: "user",
            content: "What is classical conditioning?",
        });

        expect(messages[2]).toEqual({
            role: "assistant",
            content: "Classical conditioning is learning through association.",
        });

        expect(messages[3].role).toBe("user");

        expect(messages[3].content).toContain(
            "Can you give me an example of that?"
        );

        expect(messages[3].content).toContain(
            "Classical conditioning involves learning through associations."
        );
    });
});