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

    it("sends the current question and study evidence", async () => {
        mockCreate.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: "Here is an example.",
                    },
                },
            ],
        });

        const answer = await generateAnswer(
            "Can you give me an example of that?",
            "Classical conditioning involves learning through associations."
        );

        expect(answer).toBe("Here is an example.");
        expect(mockCreate).toHaveBeenCalledOnce();
        const request = mockCreate.mock.calls[0][0];
        const messages = request.messages;

        expect(messages).toHaveLength(2);
        expect(messages[1].role).toBe("user");

        expect(messages[1].content).toContain(
            "Can you give me an example of that?"
        );

        expect(messages[1].content).toContain(
            "Classical conditioning involves learning through associations."
        );
    });
});