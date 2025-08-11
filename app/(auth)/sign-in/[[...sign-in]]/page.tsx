import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <SignIn
        afterSignInUrl="/home"
        signInFallbackRedirectUrl="/home"
      />
    </div>
  );
}
