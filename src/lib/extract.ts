import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(getPath());

export async function extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({
        data: buffer,
    });

    try {
        const result = await parser.getText();
        //remove null characters
        return result.text.replace(/\u0000/g, "");
    } finally {
        await parser.destroy();
    }
}