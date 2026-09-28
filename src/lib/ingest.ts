import { extractPdfText } from "./extract";
import { chunkDocument } from "./chunk";
import { embedChunks } from "./embed";
import { insertChunks, createDocument, findDocument, deleteDocument} from "./db";
import {hashFile} from "./hash";
import {DuplicateDocumentError} from "./errors";

export async function ingestPdf(userId: string, buffer: Buffer, sourceDoc: string, metadata: Record<string, string | number | boolean>): Promise<number> {
    const subject = metadata.subject;

    if (typeof subject !== "string") {
        throw new Error("Subject is required");
    }

    const fileHash = hashFile(buffer);

    const existingDocument = await findDocument(userId, subject, fileHash);

    if (existingDocument) {
        throw new DuplicateDocumentError(
            existingDocument.file_name
        );
    }

    const document = await createDocument(userId, sourceDoc, fileHash, subject);

    try {
        const text = await extractPdfText(buffer);
        const chunks = chunkDocument(text, sourceDoc, metadata);
        const embeddedChunks = await embedChunks(chunks);

        await insertChunks(embeddedChunks, document.id);

        return embeddedChunks.length;
    } catch (error) {
        await deleteDocument(userId, document.id);
        throw error;
    }
}