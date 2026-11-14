import { useRef, type FormEvent, type Ref } from "react";
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

    return (
        <section className={styles.chatArea}>
            <div className={hasConversation ? styles.chat : styles.welcome}>
                {!hasConversation && (
                    <h2 className={`${styles.welcomeTitle} ${styles.ragText}`}>
                        {displayName ? `hello ${displayName}!` : "hello!"}
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
                                            ? styles.userMessage
                                            : styles.assistantMessage
                                    }
                                >
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
