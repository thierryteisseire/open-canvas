import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import NextImage from "next/image";
import Link from "next/link";
import { buttonVariants } from "../../ui/button";
import { UserAuthForm } from "./user-auth-form-signup";
import { signup } from "./actions";
import { useSearchParams, useRouter } from "next/navigation";

export interface SignupWithEmailInput {
  email: string;
  password: string;
}

export function Signup() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      // Remove the error parameter from the URL after a short delay
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("error");
        const newUrl = newSearchParams.toString() 
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl, { scroll: false });
      }, 100);
    }
  }, [searchParams, router]);

  const onSignupWithEmail = async (
    input: SignupWithEmailInput
  ): Promise<void> => {
    setErrorMessage(null);
    await signup(input, window.location.origin);
  };

  const onSignupWithOauth = async (
    _provider: "google" | "github"
  ): Promise<void> => {
    // OAuth not configured - using email/password only
    console.log("OAuth not configured");
  };

  return (
    <div className="container relative h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/auth/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute md:flex hidden right-4 top-4 md:right-8 md:top-8"
        )}
      >
        Login
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex gap-1 items-center text-lg font-medium">
          <NextImage
            src="/lc_logo.jpg"
            width={36}
            height={36}
            alt="Gutenberg AI Logo"
            className="rounded-full"
          />
          Gutenberg AI
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "md:hidden flex"
              )}
            >
              Login
            </Link>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          <UserAuthForm
            onSignupWithEmail={onSignupWithEmail}
            onSignupWithOauth={onSignupWithOauth}
          />
          {errorMessage && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
