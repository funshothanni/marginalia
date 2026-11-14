import type { WorkspaceTheme } from "./useWorkspaceTheme";
import styles from "./WorkspaceThemeToggle.module.css";

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
