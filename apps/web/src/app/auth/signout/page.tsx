"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    async function signOut() {
      try {
        // Clear the auth token cookie
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/auth/login");
      } catch (error) {
        console.error("Sign out error:", error);
        setErrorOccurred(true);
      }
    }
    signOut();
  }, [router]);

  return (
    <>
      {errorOccurred ? (
        <div>
          <h1>Sign out error</h1>
          <p>
            There was an error signing out. Please refresh the page to try
            again.
          </p>
        </div>
      ) : (
        <p>Signing out...</p>
      )}
    </>
  );
}
