import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <SignUp
        afterSignUpUrl="/home"
        signInFallbackRedirectUrl="/home"
      />
    </div>
  );
}
