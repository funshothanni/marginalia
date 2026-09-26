import { beforeEach, describe, expect, it, vi } from "vitest";
const { mockEmbedText, mockSearchChunks, mockGenerateAnswer,  mockRewriteQuestion } = vi.hoisted(() => {
    return {
        mockEmbedText: vi.fn(),
        mockSearchChunks: vi.fn(),
        mockGenerateAnswer: vi.fn(),
        mockRewriteQuestion: vi.fn(),
    };
});

vi.mock("../lib/embed", () => ({
    embedText: mockEmbedText,
}));

vi.mock("../lib/db", () => ({
    searchChunks: mockSearchChunks,
}));

vi.mock("../lib/generate", () => ({
    generateAnswer: mockGenerateAnswer,
}));

vi.mock("../lib/rewrite", () => ({
    rewriteQuestion: mockRewriteQuestion,
}));

import { askQuestion } from "../lib/rag";

describe("askQuestion", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRewriteQuestion.mockImplementation(
            async (question: string) => question
        );
    });

    it("returns an answer using retrieved context", async () => {
        mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);
       mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Vector similarity compares numerical representations of text.",
                source_doc: "test.txt",
                metadata: { course: "TEST" },
                similarity: 0.9,
            },

            {
                id: 2,
                text: "RAG uses similarity search to retrieve relevant information.",
                source_doc: "test.txt",
                metadata: { course: "TEST" },
                similarity: 0.8,
            },
        ]);

       mockGenerateAnswer.mockResolvedValue(
            "Vector similarity compares text embeddings to find related information."
        );

        const question = "What is vector similarity?";
        const subject = "COMP"
        const answer = await askQuestion(question, subject);

        expect(answer).toBe("Vector similarity compares text embeddings to find related information.");
        expect(mockEmbedText).toHaveBeenCalledWith(question);
        expect(mockSearchChunks).toHaveBeenCalledWith([0.1, 0.2, 0.3], subject, 5);
        expect(mockGenerateAnswer).toHaveBeenCalledWith(question, "Vector similarity compares numerical representations of text.\n\n" + "RAG uses similarity search to retrieve relevant information.", []);
    });

    it("passes conversation history to generateAnswer", async () => {
        mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);

        mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Classical conditioning is a form of learning through association.",
                source_doc: "psychology.pdf",
                metadata: { subject: "PSYC" },
                similarity: 0.9,
            },
        ]);

        mockGenerateAnswer.mockResolvedValue(
            "An example is a dog learning to associate a bell with food."
        );

        const conversationHistory = [
            {
                id: 1,
                chat_id: 7,
                role: "user" as const,
                content: "What is classical conditioning?",
                created_at: "2026-09-24T10:00:00Z",
            },
            {
                id: 2,
                chat_id: 7,
                role: "assistant" as const,
                content: "Classical conditioning is learning through association.",
                created_at: "2026-09-24T10:00:05Z",
            },
        ];

        await askQuestion(
            "Can you give me an example of that?",
            "PSYC",
            conversationHistory
        );

        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            "Can you give me an example of that?",
            "Classical conditioning is a form of learning through association.",
            [
                {
                    role: "user",
                    content: "What is classical conditioning?",
                },
                {
                    role: "assistant",
                    content: "Classical conditioning is learning through association.",
                },
            ]
        );
    });

    it("limits conversation history to the 10 most recent messages", async () => {
        mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);

        mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Relevant study material.",
                source_doc: "test.pdf",
                metadata: { subject: "PSYC" },
                similarity: 0.9,
            },
        ]);

        mockGenerateAnswer.mockResolvedValue("Answer");

        const conversationHistory = Array.from(
            { length: 12 },
            (_, index) => ({
                id: index + 1,
                chat_id: 7,
                role: "user" as const,
                content: `Message ${index + 1}`,
                created_at: `2026-09-24T10:00:${String(index).padStart(2, "0")}Z`,
            })
        );

        await askQuestion(
            "Current question",
            "PSYC",
            conversationHistory
        );

        const expectedHistory = Array.from(
            { length: 10 },
            (_, index) => ({
                role: "user" as const,
                content: `Message ${index + 3}`,
            })
        );

        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            "Current question",
            "Relevant study material.",
            expectedHistory
        );
    });

    it("uses the rewritten question for retrieval and the original question for generation", async () => {
        const question = "Can you explain the second one more simply?";

        const history = [
            {
                id: 1,
                chat_id: 1,
                role: "assistant" as const,
                content: "1. Probability\n2. Linear Algebra\n3. Vector Calculus",
                created_at: "2026-09-25T00:00:00Z",
            },
        ];

        mockRewriteQuestion.mockResolvedValue(
            "Can you explain Linear Algebra more simply?"
        );

        mockEmbedText.mockResolvedValue([0.1, 0.2]);

        mockSearchChunks.mockResolvedValue([
            {
                id: 1,
                text: "Linear algebra studies vectors and matrices.",
                source_doc: "notes.pdf",
                metadata: {},
                similarity: 0.9,
            },
        ]);

        mockGenerateAnswer.mockResolvedValue(
            "Linear algebra is..."
        );

        await askQuestion(
            question,
            "COMP",
            history
        );

        expect(mockRewriteQuestion).toHaveBeenCalledWith(
            question,
            [
                {
                    role: "assistant",
                    content: "1. Probability\n2. Linear Algebra\n3. Vector Calculus",
                },
            ]
        );

        expect(mockEmbedText).toHaveBeenCalledWith(
            "Can you explain Linear Algebra more simply?"
        );

        expect(mockGenerateAnswer).toHaveBeenCalledWith(
            question,
            "Linear algebra studies vectors and matrices.",
            [
                {
                    role: "assistant",
                    content: "1. Probability\n2. Linear Algebra\n3. Vector Calculus",
                },
            ]
        );
    });
})