import Link from "next/link";
import type { Chat, StudyDocument } from "./workspaceTypes";
import styles from "./page.module.css";

function TrashIcon() {
    return (
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
    );
}

type Props = {
    displayName: string;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    subjects: string[];
    selectedSubject: string;
    selectSubject: (subject: string) => void;
    showAddSubject: boolean;
    setShowAddSubject: (show: boolean) => void;
    newSubject: string;
    setNewSubject: (subject: string) => void;
    handleAddSubject: () => void;
    handleDeleteSubject: () => Promise<void>;
    isDeletingSubject: boolean;
    canDeleteSubject: boolean;
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
    handleDeleteChat: (chat: Chat) => Promise<void>;
    chatActionsDisabled: boolean;
};

export default function WorkspaceSidebar({
    displayName,
    sidebarOpen,
    setSidebarOpen,
    subjects,
    selectedSubject,
    selectSubject,
    showAddSubject,
    setShowAddSubject,
    newSubject,
    setNewSubject,
    handleAddSubject,
    handleDeleteSubject,
    canDeleteSubject,
    isDeletingSubject,
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
    handleDeleteChat,
    chatActionsDisabled,
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
        <div className={styles.subjectSection}>
            <label className={styles.label}>
                <span className={styles.brandLabel}>subject</span>
            </label>

            <select
                className={styles.select}
                value={selectedSubject}
                onChange={(event) => selectSubject(event.target.value)}
            >
                <option value="">
                    select subject
                </option>

                {subjects.map((subject) => (
                    <option
                        className={styles.subjectCode}
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
                add new subject
            </button>

            {canDeleteSubject && (
                <button
                    className={`${styles.addSubjectButton} ${styles.deleteSubjectButton}`}
                    type="button"
                    onClick={handleDeleteSubject}
                    disabled={isDeletingSubject}
                >
                    {isDeletingSubject ? "deleting subject…" : "delete subject"}
                </button>
            )}

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
                        placeholder="e.g. COMP 2000"
                        value={newSubject}
                        onChange={(event) =>
                            setNewSubject(
                                event.target.value
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
                        save subject
                    </button>
                </div>
            )}
        </div>

        {selectedSubject && (
            <div className={styles.uploadedDocuments}>
                <p className={styles.label}>
                    <span className={styles.brandLabel}>uploaded documents</span>
                </p>
                {documents.length === 0 ? (
                    <p>no <span className={styles.subjectCode}>{selectedSubject}</span> documents uploaded yet.</p>
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
                                    aria-label={`delete ${document.file_name.toLowerCase()}`}
                                    title="delete document"
                                >
                                    <TrashIcon />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )}

        <div className={styles.uploadSection}>
            <p className={styles.label}><span className={styles.brandLabel}>upload course material</span></p>

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
                    {file ? "change chosen PDF" : "choose your " + selectedSubject + " document"}
                </label>
            </div>

            <div id="pdfFileName" className={styles.pdfSelectionStatus} role="status">
                {file && (
                    <div className={styles.selectedPdf}>
                        <p className={styles.label}>
                            <span className={`${styles.brandLabel} ${styles.preserveCase}`}>selected PDF</span>
                        </p>
                        <p className={styles.fileName}>{file.name}</p>
                    </div>
                )}
            </div>

            <button
                className={styles.uploadButton}
                type="button"
                onClick={handleFileUpload}
                disabled={isUploading || !file}
            >
                {isUploading ? "uploading…" : "upload PDF"}
            </button>

            <div role="status">
                {isUploading ? "uploading and processing PDF…" : uploadedFile && (
                    <p className={styles.uploadedFile}>Uploaded: {uploadedFile.name}</p>
                )}
            </div>
        </div>
        <div className={styles.chatHistorySection}>
            <div className={styles.chatHistoryHeader}>
                <p className={styles.label}>
                    <span className={styles.brandLabel}>chat history</span>
                </p>


            </div>
            {chats.length === 0 ? (
                <p className={styles.noChats}>
                    No previous chats yet.
                </p>
            ) : (
                <div className={styles.chatHistoryList}>
                    {chats.map((chat) => (
                        <div key={chat.id} className={styles.chatHistoryRow}>
                            <button
                                type="button"
                                className={`${styles.chatHistoryItem} ${selectedChatId === chat.id ? styles.activeChat : ""}`}
                                onClick={() => handleSelectChat(chat.id)}
                                disabled={chatActionsDisabled}
                            >
                                <span className={styles.chatHistorySubject}>{chat.title}</span>
                            </button>
                            <button
                                type="button"
                                className={styles.deleteChatButton}
                                onClick={() => handleDeleteChat(chat)}
                                aria-label={`Delete chat: ${chat.title}`}
                                title="Delete chat"
                                disabled={chatActionsDisabled}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className={styles.accountSection}>
            <Link
                className={styles.profileLink}
                href="/app/profile"
                title="open profile"
                onClick={() => setSidebarOpen(false)}
            >
                <span className={styles.profileAvatar} aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="3" />
                        <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                </span>
                <span className={styles.profileName}>{displayName || "profile"}</span>
            </Link>
        </div>
    </aside>
    );
}
