"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#1C1917] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 shadow-md">
            <span className="text-sm font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>S</span>
          </div>
          <span className="font-pacifico text-xl text-white">Sarvast</span>
        </div>
        <div>
          <p className="text-2xl font-semibold leading-snug text-white">
            "Strategy is not a plan.<br />
            It's a living thing."
          </p>
          <p className="mt-3 text-sm text-white/40">AI-powered marketing intelligence</p>
        </div>
        <div className="flex items-center gap-6">
          {["Agni", "Guru", "Narad", "Karma", "Chitra"].map((name) => (
            <span key={name} className="text-xs text-white/25">{name}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 shadow-md">
              <span className="text-sm font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>S</span>
            </div>
            <span className="font-pacifico text-lg">Sarvast</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your marketing workspace
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:shadow-md"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">Terms</span>
            {" "}and{" "}
            <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
