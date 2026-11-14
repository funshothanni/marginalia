import AuthAppearance from "@/components/AuthAppearance";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export default function LoginPage() {
    return (
        <AuthAppearance>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>marginalia</h1>
                    <p>log in to continue studying.</p>
                </div>
                <LoginForm />

                <p className={styles.footer}>
                    don&#39;t have an account?{" "}
                    <a href="/signup">sign up</a>
                </p>
            </div>
        </AuthAppearance>
    );
}
