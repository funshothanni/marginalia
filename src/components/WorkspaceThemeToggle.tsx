import type { WorkspaceTheme } from "./useWorkspaceTheme";
import styles from "./WorkspaceThemeToggle.module.css";

export default function WorkspaceThemeToggle({
    theme,
    onChange,
    inline = false,
}: {
    theme: WorkspaceTheme;
    inline?: boolean;
    onChange: (theme: WorkspaceTheme) => void;
}) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `switch to ${nextTheme} mode`;

    return (
        <button
            type="button"
            className={inline ? `${styles.themeToggle} ${styles.inlineToggle}` : styles.themeToggle}
            aria-label={label}
            title={label}
            onClick={() => onChange(nextTheme)}
        >
            <span aria-hidden="true">{nextTheme === "light" ? "☀︎" : "☾"}</span>
        </button>
    );
}
