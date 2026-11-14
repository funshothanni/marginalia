"use client";

import {Inter} from "next/font/google";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import ChatPanel from "./ChatPanel";
import WorkspaceThemeToggle from "@/components/WorkspaceThemeToggle";
import { useWorkspaceTheme } from "@/components/useWorkspaceTheme";
import WorkspaceSidebar from "./WorkspaceSidebar";
import type { Chat, Message, StudyDocument } from "./workspaceTypes";

const SELECTED_SUBJECT_STORAGE_KEY = "selectedSubject";

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

    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");

    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubject, setNewSubject] = useState("");

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
                setSubjects(data.subjects);

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
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (selectedSubject === "") {
            alert("Please select a subject first.");
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
                        chatData.error ||
                        "Failed to create chat."
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

                alert(
                    data.error ||
                    "Question failed."
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

            alert("Question failed.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleAddSubject() {
        const subject = newSubject
            .trim()
            .toUpperCase();

        if (!/^[A-Z]{3}$/.test(subject) && !/^[A-Z]{4}$/.test(subject)) {
            alert(
                "Subject must be 3 or 4 letters."
            );
            return;
        }

        if (!subjects.includes(subject)) {
            setSubjects((previousSubjects) => [
                ...previousSubjects,
                subject
            ]);
        }

        selectSubject(subject);

        setNewSubject("");
        setShowAddSubject(false);
    }

    async function handleDeleteDocument(documentId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
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
                    data.error ||
                    "Failed to delete document."
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

            alert("Failed to delete document.");
        }
    }

    function handleNewChat() {
        setSelectedChatId(null);
        setMessages([]);
        setQuestion("");
    }
    function selectFile(file: File) {
        setFile(file);
        setUploadedFile(null);
    }

    async function handleFileUpload(fileToUpload: File | null = file) {
        if (isUploading) {
            return;
        }

        if (selectedSubject === "") {
            alert("Please select a subject first.");
            return;
        }

        if (!fileToUpload) {
            alert("Please choose a PDF first.");
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
                    data.error ||
                    "File upload failed."
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

            alert("File upload failed.");
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
                <button
                    className={styles.menuButton}
                    type="button"
                    onClick={() =>
                        setSidebarOpen(true)
                    }
                >
                    ☰
                </button>

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
                handleNewChat={handleNewChat}
                subjects={subjects}
                selectedSubject={selectedSubject}
                selectSubject={selectSubject}
                showAddSubject={showAddSubject}
                setShowAddSubject={setShowAddSubject}
                newSubject={newSubject}
                setNewSubject={setNewSubject}
                handleAddSubject={handleAddSubject}
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
            />

            <ChatPanel
                displayName={displayName}
                hasConversation={selectedChatId !== null || messages.length > 0}
                subjects={subjects}
                onSelectSubject={selectSubject}
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
