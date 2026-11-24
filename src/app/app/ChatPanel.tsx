import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { Message } from "./workspaceTypes";
import styles from "./page.module.css";

type Props = {
    displayName: string;
    hasConversation: boolean;
    subjects: string[];
    onSelectSubject: (subject: string) => void;
    selectedSubject: string;
    isUploading: boolean;
    uploadedFileName?: string;
    onUploadFile: (file: File) => Promise<void>;
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: Ref<HTMLDivElement>;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    question: string;
    setQuestion: (question: string) => void;
};

export default function ChatPanel({
    displayName,
    hasConversation,
    subjects,
    onSelectSubject,
    selectedSubject,
    isUploading,
    uploadedFileName,
    onUploadFile,
    messages,
    isLoading,
    messagesEndRef,
    handleSubmit,
    question,
    setQuestion,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Track the message object so feedback cannot carry over to another chat's row.
    const [copyFeedback, setCopyFeedback] = useState<{ message: Message; label: string } | null>(null);

    useEffect(() => {
        if (!copyFeedback) return;

        const timeout = window.setTimeout(() => setCopyFeedback(null), 2000);
        return () => window.clearTimeout(timeout);
    }, [copyFeedback]);

    async function copyMessage(message: Message) {
        try {
            // Copy the original text to preserve Markdown and LaTeX.
            await navigator.clipboard.writeText(message.text);
            setCopyFeedback({ message, label: "Copied" });
        } catch {
            setCopyFeedback({ message, label: "Couldn't copy" });
        }
    }

    return (
        <section className={styles.chatArea}>
            <div className={hasConversation ? styles.chat : styles.welcome}>
                {!hasConversation && (
                    <h2 className={`${styles.welcomeTitle} ${styles.ragText}`}>
                        {displayName ? `Hello ${displayName}!` : "Hello!"}
                    </h2>
                )}
                {hasConversation && (
                    <>

                        <p className={styles.currentSubject} role="status">
                            <span>selected subject: </span>
                            <strong className={selectedSubject ? styles.subjectCode : undefined}>{selectedSubject || "none selected"}</strong>
                        </p>
                        <div className={styles.messages}>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={
                                        message.role === "user"
                                            ? styles.userMessageGroup
                                            : styles.assistantMessageGroup
                                    }
                                >
                                    <div className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>
                                        {message.role === "assistant" ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                            >
                                                {message.text}
                                            </ReactMarkdown>
                                        ) : (
                                            message.text
                                        )}
                                    </div>
                                    <div className={styles.messageActions}>
                                        <span className={styles.copyMessageStatus} role="status">
                                            {copyFeedback?.message === message ? copyFeedback.label : ""}
                                        </span>
                                        <button
                                            className={styles.copyMessageButton}
                                            type="button"
                                            aria-label="Copy message"
                                            title="Copy message"
                                            onClick={() => void copyMessage(message)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <rect x="8" y="8" width="12" height="12" rx="2" />
                                                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className={styles.typingIndicator}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </>
                )}
                <div className={styles.chatUploadStatus} role="status">
                    {isUploading ? "uploading and processing PDF…" : uploadedFileName && (
                        <p className={styles.uploadedFile}>Uploaded: {uploadedFileName}</p>
                    )}
                </div>
                {/* Keep the composer mounted when the first message opens the conversation. */}
                <form
                    className={styles.form}
                    onSubmit={handleSubmit}
                >
                    <button
                        className={styles.attachButton}
                        type="button"
                        aria-label="upload a pdf"
                        title={selectedSubject ? "upload a pdf" : "select a subject to upload a pdf"}
                        disabled={!selectedSubject || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span aria-hidden="true">+</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        hidden
                        onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            event.currentTarget.value = "";

                            if (file) {
                                void onUploadFile(file);
                            }
                        }}
                    />
                    <input
                        className={`${styles.input} ${styles.questionInput}`}
                        type="text"
                        aria-label="question"
                        placeholder={selectedSubject ? `ask a ${selectedSubject} question` : "select a subject and ask a question…"}
                        value={question}
                        onChange={(event) =>
                            setQuestion(
                                event.target.value
                            )
                        }
                    />

                    <button
                        className={styles.sendButton}
                        /* Added this so the send option is unavailable if no question*/
                        disabled={question.trim() === ''  || isUploading}
                        type="submit"
                    >
                        send


                    </button>
                </form>
                {!hasConversation && (
                    <div className={styles.welcomeSubject}>
                        <select
                            aria-label="select subject"
                            className={styles.select}
                            value={selectedSubject}
                            onChange={(event) => onSelectSubject(event.target.value)}
                        >
                            <option value="">select subject</option>
                            {subjects.length === 0 && (
                                <option disabled>no subjects available</option>
                            )}
                            {subjects.map((subject) => (
                                <option className={styles.subjectCode} key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </section>
    );
}
