import styles from "./page.module.css";

export type WorkspaceTheme = "light" | "dark";

export default function WorkspaceThemeToggle({
    theme,
    onChange,
}: {
    theme: WorkspaceTheme;
    onChange: (theme: WorkspaceTheme) => void;
}) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} mode`;

    return (
        <button
            type="button"
            className={styles.themeToggle}
            aria-label={label}
            title={label}
            onClick={() => onChange(nextTheme)}
        >
            <span aria-hidden="true">{nextTheme === "light" ? "☀︎" : "☾"}</span>
        </button>
    );
}
