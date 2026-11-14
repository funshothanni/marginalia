import LogoutButton from "@/components/LogoutButton";
import { SUBJECT_CODE_LENGTH, type Chat, type StudyDocument } from "./workspaceTypes";
import styles from "./page.module.css";

type Props = {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    handleNewChat: () => void;
    subjects: string[];
    selectedSubject: string;
    selectSubject: (subject: string) => void;
    showAddSubject: boolean;
    setShowAddSubject: (show: boolean) => void;
    newSubject: string;
    setNewSubject: (subject: string) => void;
    handleAddSubject: () => void;
    documents: StudyDocument[];
    handleDeleteDocument: (id: number) => Promise<void>;
    file: File | null;
    setFile: (file: File) => void;
    handleFileUpload: () => Promise<void>;
    uploadedFile: File | null;
    isUploading: boolean;
    chats: Chat[];
    selectedChatId: number | null;
    handleSelectChat: (id: number) => Promise<void>;
};

export default function WorkspaceSidebar({
    sidebarOpen,
    setSidebarOpen,
    handleNewChat,
    subjects,
    selectedSubject,
    selectSubject,
    showAddSubject,
    setShowAddSubject,
    newSubject,
    setNewSubject,
    handleAddSubject,
    documents,
    handleDeleteDocument,
    file,
    setFile,
    handleFileUpload,
    uploadedFile,
    isUploading,
    chats,
    selectedChatId,
    handleSelectChat,
}: Props) {
    return (
    <aside
        className={`${styles.sidebar} ${
            sidebarOpen
                ? styles.sidebarOpen
                : ""
        }`}
    >
        <button
            className={styles.closeSidebarButton}
            type="button"
            onClick={() =>
                setSidebarOpen(false)
            }
        >
            ×
        </button>
        <button
            className={`${styles.label} ${styles.newChatButton}`}
            type="button"
            onClick={handleNewChat}
        >
            <span className={styles.brandLabel}>New Chat</span>

            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
        </button>

        <div className={styles.subjectSection}>
            <label className={styles.label}>
                <span className={styles.brandLabel}>Subject</span>
            </label>

            <select
                className={styles.select}
                value={selectedSubject}
                onChange={(event) => selectSubject(event.target.value)}
            >
                <option value="">
                    Select subject
                </option>

                {subjects.map((subject) => (
                    <option
                        key={subject}
                        value={subject}
                    >
                        {subject}
                    </option>
                ))}
            </select>

            <button
                className={
                    styles.addSubjectButton
                }
                type="button"
                onClick={() =>
                    setShowAddSubject(
                        !showAddSubject
                    )
                }
            >
                Add Subject
            </button>

            {showAddSubject && (
                <div
                    className={
                        styles.addSubjectBox
                    }
                >
                    <input
                        className={
                            styles.subjectInput
                        }
                        type="text"
                        placeholder="e.g. COMP"
                        maxLength={SUBJECT_CODE_LENGTH}
                        value={newSubject}
                        onChange={(event) =>
                            setNewSubject(
                                event.target.value
                                    .toUpperCase()
                            )
                        }
                    />

                    <button
                        className={
                            styles.saveSubjectButton
                        }
                        type="button"
                        onClick={
                            handleAddSubject
                        }
                    >
                        Save Subject
                    </button>
                </div>
            )}
        </div>

        {selectedSubject && (
            <div>
                <p className={styles.label}>
                    Uploaded Documents
                </p>
                {documents.length === 0 ? (
                    <p>No {selectedSubject} documents uploaded yet.</p>
                ) : (
                    <ul>
                        {documents.map((document) => (
                            <li
                                key={document.id}
                                className={styles.documentItem}
                            >
    <span className={styles.documentName}>
{document.file_name}
    </span>
                                <button
                                    className={styles.deleteDocumentButton}
                                    type="button"
                                    onClick={() =>
                                        handleDeleteDocument(document.id)
                                    }
                                    aria-label={`Delete ${document.file_name}`}
                                    title="Delete document"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 6h18"/>
                                        <path d="M8 6V4h8v2"/>
                                        <path d="M19 6l-1 14H6L5 6"/>
                                        <path d="M10 11v5"/>
                                        <path d="M14 11v5"/>
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )}

        <div className={styles.uploadSection}>
            <p className={styles.label}><span className={styles.brandLabel}>Upload Study Material</span></p>

            <div className={styles.filePicker}>
                <input
                    id="pdfFile"
                    className={styles.hiddenFileInput}
                    type="file"
                    accept=".pdf"
                    disabled={isUploading}
                    aria-describedby="pdfFileName"
                    onChange={(event) => {
                        const chosenFile = event.currentTarget.files?.[0];

                        if (chosenFile) {
                            setFile(chosenFile);
                            event.currentTarget.value = "";
                        }
                    }}
                />
                <label htmlFor="pdfFile" className={styles.chooseFileButton}>
                    Choose PDF
                </label>
            </div>

            <p id="pdfFileName" className={styles.fileName}>
                {file ? file.name : "No PDF selected"}
            </p>

            <button
                className={styles.uploadButton}
                type="button"
                onClick={handleFileUpload}
                disabled={isUploading || !file}
            >
                {isUploading ? "Uploading…" : "Upload PDF"}
            </button>

            <div role="status">
                {isUploading ? "Uploading and processing PDF…" : uploadedFile && (
                    <p className={styles.uploadedFile}>Uploaded: {uploadedFile.name}</p>
                )}
            </div>
        </div>
        <div className={styles.chatHistorySection}>
            <div className={styles.chatHistoryHeader}>
                <p className={styles.label}>
                    <span className={styles.brandLabel}>Chat History</span>
                </p>


            </div>
            {chats.length === 0 ? (
                <p className={styles.noChats}>
                    No previous chats yet.
                </p>
            ) : (
                <div className={styles.chatHistoryList}>
                    {chats.map((chat) => (
                        <button
                            key={chat.id}
                            type="button"
                            className={`${styles.chatHistoryItem} ${
                                selectedChatId === chat.id
                                    ? styles.activeChat
                                    : ""
                            }`}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            <span className={styles.chatHistorySubject}>
                                {chat.title}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
        <div className={styles.accountSection}>
            <LogoutButton />
        </div>
    </aside>
    );
}
