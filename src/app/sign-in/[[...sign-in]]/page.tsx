import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <SignIn
                appearance={{
                    elements: {
                        formButtonPrimary: "bg-amber-500 hover:bg-amber-600",
                        card: "bg-slate-800 border-slate-700",
                        headerTitle: "text-slate-100",
                        headerSubtitle: "text-slate-400",
                        formFieldLabel: "text-slate-300",
                        formFieldInput: "bg-slate-700 border-slate-600 text-slate-100",
                        footerActionLink: "text-amber-400 hover:text-amber-300",
                    },
                }}
            />
        </div>
    );
}
