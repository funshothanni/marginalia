"use client";

import {Inter} from "next/font/google";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { COURSE_SUBJECT_FORMAT_HINT, parseCourseSubject } from "@/lib/courseSubject";
import NewChatIcon from "./NewChatIcon";
import ChatPanel from "./ChatPanel";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import WorkspaceSidebar from "./WorkspaceSidebar";
import type { Chat, Message, StudyDocument } from "./workspaceTypes";

const SELECTED_SUBJECT_STORAGE_KEY = "selectedSubject";
const UPLOAD_CONFIRMATION_DURATION_MS = 5_000;

const inter = Inter({
    subsets: ["latin"]
});

export default function Workspace({ displayName }: { displayName: string }) {
    const { theme, changeTheme } = useWorkspaceTheme();

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

    const [documents, setDocuments] = useState<StudyDocument[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [isDeletingSubject, setIsDeletingSubject] = useState(false);

    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");

    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubject, setNewSubject] = useState("");

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSelectingChat, setIsSelectingChat] = useState(false);
    const [isDeletingChat, setIsDeletingChat] = useState(false);
    // Serialize chat actions so a pending request cannot reopen or write to a deleted chat.
    const chatActionsDisabled = isLoading || isSelectingChat || isDeletingChat || isDeletingSubject;

    useEffect(() => {
        // Start the timer when the success message replaces the upload progress.
        if (!uploadedFile || isUploading) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setUploadedFile(null);
        }, UPLOAD_CONFIRMATION_DURATION_MS);

        return () => window.clearTimeout(timeoutId);
    }, [uploadedFile, isUploading]);

    useEffect(() => {
        async function loadSubjects() {
            try {
                const response = await fetch("/api/subjects");
                const data = await response.json();

                if (!response.ok) {
                    console.warn(
                        "Failed to load subjects:",
                        data.error
                    );
                    return;
                }
                setSubjects((previous) => [...new Set([...previous, ...data.subjects])]);

                const savedSubject =
                    localStorage.getItem(SELECTED_SUBJECT_STORAGE_KEY);

                if (
                    savedSubject &&
                    data.subjects.includes(savedSubject)
                ) {
                    setSelectedSubject(savedSubject);
                }
            } catch (error) {
                console.error(
                    "Failed to load subjects:",
                    error
                );
            }
        }

        loadSubjects();
    }, []);
    useEffect(() => {
        async function loadChats() {
            try {
                const response = await fetch("/api/chats");
                const data = await response.json();

                if (!response.ok) {
                    console.error(
                        "Failed to load chats:",
                        data.error
                    );
                    return;
                }

                setChats(data.chats);
            } catch (error) {
                console.error(
                    "Failed to load chats:",
                    error
                );
            }
        }

        loadChats();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, isLoading]);

    useEffect(() => {
        if (!selectedSubject) {
            return;
        }

        async function loadDocuments() {
            const response = await fetch(
                `/api/documents?subject=${encodeURIComponent(selectedSubject)}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setDocuments(data.documents);
        }

        loadDocuments();
    }, [selectedSubject]);

    function selectSubject(subject: string) {
        setSelectedSubject(subject);
        localStorage.setItem(SELECTED_SUBJECT_STORAGE_KEY, subject);
    }

    async function handleSelectChat(chatId: number) {
        if (chatActionsDisabled) return;
        setIsSelectingChat(true);

        try {
            const response = await fetch(
                `/api/messages?chatId=${chatId}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to load messages:",
                    data.error
                );
                return;
            }

            const loadedMessages: Message[] = data.messages.map(
                (message: {
                    role: "user" | "assistant";
                    content: string;
                }) => ({
                    role: message.role,
                    text: message.content
                })
            );

            setSelectedChatId(chatId);
            setMessages(loadedMessages);

            // Restore the subject associated with this chat
            const selectedChat = chats.find((chat) => chat.id === chatId);

            if (selectedChat) {
                selectSubject(selectedChat.subject);
            }
        } catch (error) {
            console.error(
                "Failed to load messages:",
                error
            );
        } finally {
            setIsSelectingChat(false);
        }
    }

    async function handleDeleteChat(chat: Chat) {
        if (chatActionsDisabled || !window.confirm(`Delete "${chat.title}" and all its messages?`)) {
            return;
        }

        setIsDeletingChat(true);
        try {
            const response = await fetch(`/api/chats?id=${chat.id}`, { method: "DELETE" });
            if (!response.ok) {
                throw new Error("Chat deletion failed.");
            }

            setChats((previous) => previous.filter((entry) => entry.id !== chat.id));
            if (selectedChatId === chat.id) {
                handleNewChat();
            }
        } catch (error) {
            console.error(error);
            window.alert("Could not delete the chat. Please try again.");
        } finally {
            setIsDeletingChat(false);
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        if (chatActionsDisabled) return;

        if (selectedSubject === "") {
            alert("please select a subject first.");
            return;
        }

        if (!parseCourseSubject(selectedSubject)) {
            alert(COURSE_SUBJECT_FORMAT_HINT);
            return;
        }

        if (question.trim() === "") {
            return;
        }

        const currentQuestion = question;

        const userMessage: Message = {
            role: "user",
            text: currentQuestion
        };

        setMessages((previousMessages) => [
            ...previousMessages,
            userMessage
        ]);

        setQuestion("");
        setIsLoading(true);

        try {
            let chatId = selectedChatId;

            // Create a new chat if one is not currently selected
            if (chatId === null) {
                const chatResponse = await fetch("/api/chats", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        subject: selectedSubject
                    })
                });

                const chatData = await chatResponse.json();

                if (!chatResponse.ok) {
                    console.error(
                        "Failed to create chat:",
                        chatData.error
                    );

                    alert(
                        (chatData.error || "failed to create chat.").toLowerCase()
                    );

                    return;
                }

                chatId = chatData.chat.id;

                setSelectedChatId(chatId);

                // Add the new chat to the sidebar
                setChats((previousChats) => [
                    chatData.chat,
                    ...previousChats
                ]);
            }

            // Send the question to the selected chat
            const response = await fetch("/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    subject: selectedSubject,
                    chatId: chatId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Question failed:",
                    data.error
                );

                if (response.status === 422) {
                    setMessages((previous) => previous.filter((message) => message !== userMessage));
                    setQuestion((draft) => draft || currentQuestion);
                }

                alert(
                    (data.error || "question failed.").toLowerCase()
                );

                return;
            }

            const assistantMessage: Message = {
                role: "assistant",
                text: data.answer
            };

            setMessages((previousMessages) => [
                ...previousMessages,
                assistantMessage
            ]);

            // Refresh chat history so the new title appears
            const chatsResponse = await fetch("/api/chats");

            if (chatsResponse.ok) {
                const chatsData = await chatsResponse.json();
                setChats(chatsData.chats);
            }

        } catch (error) {
            console.error(
                "Question failed:",
                error
            );

            alert("question failed.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleAddSubject() {
        if (isDeletingSubject) return;
        const courseSubject = parseCourseSubject(newSubject);
        if (!courseSubject) {
            alert(COURSE_SUBJECT_FORMAT_HINT);
            return;
        }

        const { subject } = courseSubject;
        if (!subjects.includes(subject)) {
            setSubjects((previousSubjects) => [
                ...previousSubjects,
                subject
            ]);
        }

        changeSubject(subject);

        setNewSubject("");
        setShowAddSubject(false);
    }

    async function handleDeleteSubject() {
        if (!selectedSubject || chatActionsDisabled || isUploading) {
            return;
        }

        const subject = selectedSubject;
        if (!window.confirm(`delete ${subject}? this permanently deletes all related chats, messages, and uploaded PDFs.`)) {
            return;
        }

        setIsDeletingSubject(true);
        try {
            const response = await fetch(`/api/subjects?subject=${encodeURIComponent(subject)}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("subject deletion failed");
            }

            setSubjects((previous) => previous.filter((entry) => entry !== subject));
            setChats((previous) => previous.filter((chat) => chat.subject !== subject));
            setDocuments([]);
            setFile(null);
            setUploadedFile(null);
            handleNewChat();
            selectSubject("");
        } catch (error) {
            console.error(error);
            alert("could not delete the subject. please try again.");
        } finally {
            setIsDeletingSubject(false);
        }
    }

    async function handleDeleteDocument(documentId: number) {
        if (isDeletingSubject) return;

        const confirmed = window.confirm(
            "are you sure you want to delete this document?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `/api/documents?id=${documentId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                alert(
                    (data.error || "failed to delete document.").toLowerCase()
                );
                return;
            }

            setDocuments((previousDocuments) =>
                previousDocuments.filter(
                    (document) =>
                        document.id !== documentId
                )
            );
        } catch (error) {
            console.error(
                "Document deletion failed:",
                error
            );

            alert("failed to delete document.");
        }
    }

    function handleNewChat() {
        setSelectedChatId(null);
        setMessages([]);
        setQuestion("");
    }
    function changeSubject(subject: string) {
        if (chatActionsDisabled) return;

        if (subject !== selectedSubject && selectedChatId !== null) {
            // Retrieval follows the chat's saved subject, so a different course needs a new chat.
            setSelectedChatId(null);
            setMessages([]);
        }
        selectSubject(subject);
    }

    function selectFile(file: File) {
        setFile(file);
        setUploadedFile(null);
    }

    async function handleFileUpload(fileToUpload: File | null = file) {
        if (isDeletingSubject) return;

        if (isUploading) {
            return;
        }

        if (selectedSubject === "") {
            alert("please select a subject first.");
            return;
        }

        if (!fileToUpload) {
            alert("please choose a pdf first.");
            return;
        }

        const formData = new FormData();

        formData.append("file", fileToUpload);
        formData.append(
            "subject",
            selectedSubject
        );

        setUploadedFile(null);
        setIsUploading(true);

        try {
            const response = await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);

                alert(
                    (data.error || "file upload failed.").toLowerCase()
                );

                return;
            }

            setUploadedFile(fileToUpload);
            setFile((pendingFile) => pendingFile === fileToUpload ? null : pendingFile);

            try {
                const documentsResponse = await fetch(
                    `/api/documents?subject=${encodeURIComponent(selectedSubject)}`
                );

                const documentsData = await documentsResponse.json();

                if (documentsResponse.ok) {
                    setDocuments(documentsData.documents);
                }
            } catch (error) {
                console.error("Failed to refresh uploaded documents:", error);
            }
        } catch (error) {
            console.error(
                "File upload failed:",
                error
            );

            alert("file upload failed.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <main
            data-theme={theme}
            className={`${styles.container} ${inter.className} ${
                sidebarOpen ? styles.sidebarActive : ""
            }`}
        >
            <header className={styles.header}>
                <div className={styles.headerActions}>
                    <button
                        className={styles.menuButton}
                        type="button"
                        aria-label="open sidebar"
                        aria-expanded={sidebarOpen}
                        onClick={() => setSidebarOpen(true)}
                    >
                        ☰
                    </button>
                    <button
                        className={`${styles.menuButton} ${styles.newChatShortcut}`}
                        type="button"
                        aria-label="new chat"
                        title="new chat"
                        onClick={handleNewChat}
                        disabled={chatActionsDisabled}
                    >
                        <NewChatIcon />
                    </button>
                </div>

                <h1 className={styles.title}>
                    <span className={styles.ragText}>
                        marginalia
                    </span>

                    <span>
                        {" "}
                    </span>
                </h1>
                <p className={styles.subtitle}>notes that talk back...</p>

                <WorkspaceThemeToggle theme={theme} onChange={changeTheme} />
            </header>


            <WorkspaceSidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                subjects={subjects}
                selectedSubject={selectedSubject}
                selectSubject={changeSubject}
                showAddSubject={showAddSubject}
                setShowAddSubject={setShowAddSubject}
                newSubject={newSubject}
                setNewSubject={setNewSubject}
                handleAddSubject={handleAddSubject}
                handleDeleteSubject={handleDeleteSubject}
                isDeletingSubject={isDeletingSubject}
                canDeleteSubject={Boolean(selectedSubject) && !chatActionsDisabled && !isUploading}
                documents={documents}
                handleDeleteDocument={handleDeleteDocument}
                file={file}
                setFile={selectFile}
                handleFileUpload={() => handleFileUpload()}
                uploadedFile={uploadedFile}
                isUploading={isUploading}
                chats={chats}
                selectedChatId={selectedChatId}
                handleSelectChat={handleSelectChat}
                handleDeleteChat={handleDeleteChat}
                chatActionsDisabled={chatActionsDisabled}
            />

            <ChatPanel
                displayName={displayName}
                hasConversation={selectedChatId !== null || messages.length > 0}
                subjects={subjects}
                onSelectSubject={changeSubject}
                isUploading={isUploading}
                uploadedFileName={uploadedFile?.name}
                onUploadFile={handleFileUpload}
                selectedSubject={selectedSubject}
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
                handleSubmit={handleSubmit}
                question={question}
                setQuestion={setQuestion}
            />
        </main>
    );
}
