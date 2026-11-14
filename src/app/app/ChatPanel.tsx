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
    onOpenSidebar: () => void;
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
    onOpenSidebar,
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
                            <span>Selected subject: </span>
                            <strong>{selectedSubject || "None selected"}</strong>
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
                    {isUploading ? "Uploading and processing PDF…" : uploadedFileName && (
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
                        aria-label="Upload a PDF"
                        title={selectedSubject ? "Upload a PDF" : "Select a subject to upload a PDF"}
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
                        className={styles.input}
                        type="text"
                        aria-label="Question"
                        placeholder={selectedSubject ? `Ask a ${selectedSubject} question` : "Select a subject and ask a question…"}
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
                        Send
                    </button>
                </form>
                {!hasConversation && (
                    <div className={styles.welcomeSubject}>
                        {subjects.length > 0 ? (
                            <>
                                <label htmlFor="welcome-subject">Subject</label>
                                <select
                                    id="welcome-subject"
                                    className={styles.select}
                                    value={selectedSubject}
                                    onChange={(event) => onSelectSubject(event.target.value)}
                                >
                                    <option value="">Select a subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <button
                                type="button"
                                className={styles.addSubjectButton}
                                onClick={onOpenSidebar}
                            >
                                Manage subjects
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
