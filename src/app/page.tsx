"use client";

import {Inter} from "next/font/google";
import {useEffect, useState} from "react";
import styles from "./page.module.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const inter = Inter({
    subsets: ["latin"]
});

export default function Home() {
    type Message = {
        role: "user" | "assistant";
        text: string;
    };

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
                    localStorage.getItem("selectedSubject");

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
            const response = await fetch("/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    subject: selectedSubject
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(data);

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
        } catch (error) {
            console.error(
                "Question failed:",
                error
            );

            alert("Question failed.");
        }finally {
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

        setSelectedSubject(subject);

        localStorage.setItem(
            "selectedSubject",
            subject
        );

        setNewSubject("");
        setShowAddSubject(false);
    }

    async function handleFileUpload() {
        if (selectedSubject === "") {
            alert("Please select a subject first.");
            return;
        }

        if (!file) {
            alert("Please choose a PDF first.");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);
        formData.append(
            "subject",
            selectedSubject
        );

        try {
            const response = await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            console.log(data);

            if (!response.ok) {
                console.error(data);

                alert(
                    data.error ||
                    "File upload failed."
                );

                return;
            }

            setUploadedFile(file);

            alert(
                "File uploaded successfully."
            );
        } catch (error) {
            console.error(
                "File upload failed:",
                error
            );

            alert("File upload failed.");
        }
    }

    return (
        <main
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

                <p className={styles.subtitle}>
                    notes that talk back...
                </p>
            </header>


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
                        Subject
                    </label>

                    <select
                        className={styles.select}
                        value={selectedSubject}
                        onChange={(event) => {
                            const subject =
                                event.target.value;

                            setSelectedSubject(
                                subject
                            );

                            localStorage.setItem(
                                "selectedSubject",
                                subject
                            );
                        }}
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
                                maxLength={4}
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

                <div className={styles.uploadSection}>
                    <label className={styles.label}>
                        Upload Study Material
                    </label>

                    <div className={styles.filePicker}>
                        <label
                            htmlFor="pdfFile"
                            className={
                                styles.chooseFileButton
                            }
                        >
                            Choose File
                        </label>

                        <span
                            className={
                                styles.fileName
                            }
                        >
                            {file
                                ? file.name
                                : "No file selected"}
                        </span>

                        <input
                            id="pdfFile"
                            className={
                                styles.hiddenFileInput
                            }
                            type="file"
                            accept=".pdf"
                            onChange={(event) => {
                                if (
                                    event.target.files &&
                                    event.target.files.length > 0
                                ) {
                                    setFile(
                                        event.target.files[0]
                                    );
                                }
                            }}
                        />
                    </div>

                    <button
                        className={
                            styles.uploadButton
                        }
                        type="button"
                        onClick={
                            handleFileUpload
                        }
                    >
                        Upload File
                    </button>

                    {uploadedFile && (
                        <p
                            className={
                                styles.uploadedFile
                            }
                        >
                            Uploaded:{" "}
                            {uploadedFile.name}
                        </p>
                    )}
                </div>
            </aside>

            <section className={styles.chatArea}>
                <div className={styles.chat}>
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
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={handleSubmit}
                    >
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(event) =>
                                setQuestion(
                                    event.target.value
                                )
                            }
                        />

                        <button
                            className={styles.button}
                            type="submit"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}