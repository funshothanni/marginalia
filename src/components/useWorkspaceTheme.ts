"use client";

import { useState, useSyncExternalStore } from "react";

export type WorkspaceTheme = "light" | "dark";

const WORKSPACE_THEME_KEY = "marginalia.workspaceTheme";
const WORKSPACE_THEME_EVENT = "marginalia:themechange";

function subscribeToTheme(onChange: () => void) {
    // Storage events only notify other tabs, so same-tab updates use a custom event.
    window.addEventListener(WORKSPACE_THEME_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
        window.removeEventListener(WORKSPACE_THEME_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

function getSavedTheme(): WorkspaceTheme {
    try {
        return localStorage.getItem(WORKSPACE_THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

function getDefaultTheme(): WorkspaceTheme {
    return "light";
}

export function useWorkspaceTheme() {
    const savedTheme = useSyncExternalStore(subscribeToTheme, getSavedTheme, getDefaultTheme);
    const [temporaryTheme, setTemporaryTheme] = useState<WorkspaceTheme>();
    const theme = temporaryTheme ?? savedTheme;

    function changeTheme(nextTheme: WorkspaceTheme) {
        try {
            localStorage.setItem(WORKSPACE_THEME_KEY, nextTheme);
            setTemporaryTheme(undefined);
            window.dispatchEvent(new Event(WORKSPACE_THEME_EVENT));
        } catch {
            setTemporaryTheme(nextTheme);
        }
    }

    return { theme, changeTheme };
}
