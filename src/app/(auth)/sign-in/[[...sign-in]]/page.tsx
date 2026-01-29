import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <main className="min-h-dvh flex items-center justify-center p-8">
            <div className="paper-card">
                <h2 className="text-center mb-6">📝 サインイン</h2>
                <SignIn
                    appearance={{
                        elements: {
                            formButtonPrimary:
                                "bg-[var(--color-ink)] hover:bg-[var(--color-ink-light)]",
                            card: "bg-transparent shadow-none",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtonsBlockButton:
                                "border-2 border-[var(--color-ink-faint)] bg-[var(--color-paper)]",
                            formFieldInput:
                                "border-2 border-[var(--color-ink-faint)] bg-[var(--color-paper)] focus:border-[var(--color-ink)]",
                        },
                    }}
                />
            </div>
        </main>
    );
}
