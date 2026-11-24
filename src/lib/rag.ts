import {embedText} from "./embed";
import {findChunksByPhrase, getDocumentsBySubject, getOverviewChunks, searchChunks} from "./db";
import {generateAnswer} from "./generate";
import type { Message } from "@/types/message";
import { rewriteQuestion } from "./rewrite";

// Course-wide search can surface weak matches from unrelated PDFs, so keep a stricter cutoff.
const MINIMUM_COURSE_CHUNK_SIMILARITY = 0.35;
// A uniquely matched PDF narrows the search. A lower cutoff recovers borderline excerpts within it.
const MINIMUM_NAMED_PDF_CHUNK_SIMILARITY = 0.33;
const OVERVIEW_CHUNK_LIMIT = 12;
const NO_SUPPORTING_MATERIAL = "I couldn't find enough information in your uploaded materials to answer that.";

function normalizeDocumentName(name: string): string {
    return name.trim().toLowerCase().replace(/\.pdf$/, "").replace(/\s+/g, " ");
}

export async function askQuestion(userId: string, question: string, subject: string, conversationHistory: Message[] = []): Promise<string> {
    const history = conversationHistory
        .slice(-10)
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));

    const { question: retrievalQuestion, scope, lookupPhrase, documentReference } = await rewriteQuestion(question, history);
    let documentId: number | undefined;
    if (documentReference) {
        const documents = await getDocumentsBySubject(userId, subject);
        const normalizedReference = normalizeDocumentName(documentReference);
        const matches = documents.filter((document) => normalizeDocumentName(document.file_name) === normalizedReference);
        if (matches.length > 1) {
            return "More than one upload matches that name. Which PDF did you mean?";
        }
        documentId = matches[0]?.id;
        if (documentId === undefined) {
            return "I couldn't find a PDF with that name in this course.";
        }
    } else if (scope === "document_overview") {
        return "Which uploaded PDF would you like me to summarize?";
    }

    // Pass the authorized document ID to every retrieval path for a named upload.
    const documentFilter = documentId === undefined ? [] as const : [documentId] as const;
    let chunks: { text: string }[];
    let generationQuestion = retrievalQuestion;
    let overviewIsSampled = false;
    if (scope === "course_overview" || scope === "document_overview") {
        const overviewChunks = await getOverviewChunks(userId, subject, OVERVIEW_CHUNK_LIMIT, ...documentFilter);
        // Supabase reports whether the sample omitted usable excerpts.
        overviewIsSampled = overviewChunks[0]?.is_sampled ?? false;
        chunks = overviewChunks;
        generationQuestion = `Summarize what the ${documentId === undefined ? "course" : "document"} excerpts establish, even if they contain only one useful detail.

Student's request: ${retrievalQuestion}`;
    } else {
        const embeddedQuestion = await embedText(retrievalQuestion);
        const matches = await searchChunks(userId, embeddedQuestion, subject, 5, ...documentFilter);
        const minimumSimilarity = documentId === undefined
            ? MINIMUM_COURSE_CHUNK_SIMILARITY
            : MINIMUM_NAMED_PDF_CHUNK_SIMILARITY;
        chunks = matches.filter((chunk) => chunk.similarity >= minimumSimilarity && chunk.text.trim());
        // A literal phrase can recover evidence that the similarity cutoff discarded.
        if (chunks.length === 0 && lookupPhrase) {
            chunks = await findChunksByPhrase(userId, subject, lookupPhrase, 5, ...documentFilter);
        }
    }

    const context = chunks
        .map((chunk) => chunk.text.trim())
        .filter(Boolean)
        .join("\n\n");
    if (!context) {
        return NO_SUPPORTING_MATERIAL;
    }

    // Earlier answers can refer to deleted material. Use history to resolve the question only.
    const answer = await generateAnswer(generationQuestion, context);
    if (overviewIsSampled) {
        return `**Coverage** · ${OVERVIEW_CHUNK_LIMIT} excerpts were selected from ${documentId === undefined ? "a larger set of course materials" : "a larger set of excerpts from the named PDF"}.\n\n${answer}`;
    }

    return answer;
}
