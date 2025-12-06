"use client";

import { Canvas } from "@/components/canvas";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider, useUserContext } from "@/contexts/UserContext";
import { Suspense } from "react";

function AppContent() {
  const { user, loading } = useUserContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load user. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <ThreadProvider>
      <AssistantProvider>
        <GraphProvider>
          <Canvas />
        </GraphProvider>
      </AssistantProvider>
    </ThreadProvider>
  );
}

export default function Home() {
  return (
    <Suspense>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Suspense>
  );
}
