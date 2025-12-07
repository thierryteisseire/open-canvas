"use client";

import { Button } from "@/components/ui/button";
import { TighterText } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { useGraphContext } from "@/contexts/GraphContext";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Thread } from "@langchain/langgraph-sdk";
import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import {
  LogOut,
  MessageSquarePlus,
  Trash2,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingsDialog } from "./settings-dialog";

interface ThreadItemProps {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  label: string;
  isActive: boolean;
}

const ThreadItem = (props: ThreadItemProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={`flex flex-row gap-0 items-center justify-between w-full rounded-lg group ${
        props.isActive ? "bg-gray-200" : "hover:bg-gray-100"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        className={`px-3 py-2 justify-start items-center flex-grow text-left h-auto ${
          props.isActive ? "bg-gray-200" : ""
        }`}
        size="sm"
        variant="ghost"
        onClick={props.onClick}
      >
        <TighterText className="truncate text-sm font-normal">
          {props.label}
        </TighterText>
      </Button>
      {isHovering && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete();
          }}
          className="p-2 hover:text-red-500 transition-colors mr-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const LoadingThread = () => <Skeleton className="w-full h-9 rounded-lg" />;

interface SidebarProps {
  switchSelectedThreadCallback: (thread: Thread) => void;
  onNewChat: () => void;
  currentThreadId?: string;
}

export function Sidebar({
  switchSelectedThreadCallback,
  onNewChat,
  currentThreadId,
}: SidebarProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUserContext();
  const {
    graphData: { setMessages },
  } = useGraphContext();
  const { deleteThread, getUserThreads, userThreads, isUserThreadsLoading } =
    useThreadContext();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || userThreads.length || !user) return;
    getUserThreads();
  }, [user]);

  const handleDeleteThread = async (id: string) => {
    if (!user) {
      toast({
        title: "Failed to delete thread",
        description: "User not found",
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    await deleteThread(id, () => setMessages([]));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        duration: 5000,
        variant: "destructive",
      });
    }
  };

  const groupThreads = () => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const sevenDaysAgo = subDays(today, 7);

    return {
      today: userThreads.filter((thread) =>
        isToday(new Date(thread.created_at))
      ),
      yesterday: userThreads.filter((thread) =>
        isYesterday(new Date(thread.created_at))
      ),
      lastSevenDays: userThreads.filter((thread) =>
        isWithinInterval(new Date(thread.created_at), {
          start: sevenDaysAgo,
          end: yesterday,
        })
      ),
      older: userThreads.filter(
        (thread) => new Date(thread.created_at) < sevenDaysAgo
      ),
    };
  };

  const groupedThreads = groupThreads();

  const prettifyDateLabel = (group: string): string => {
    switch (group) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "lastSevenDays":
        return "Previous 7 Days";
      case "older":
        return "Older";
      default:
        return group;
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed && (
            <TighterText className="text-xl font-semibold">
              Gutenberg AI
            </TighterText>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-white"
          size="sm"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          {!isCollapsed && "New Chat"}
        </Button>
      </div>

      {/* Thread List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {isUserThreadsLoading && !userThreads.length ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <LoadingThread key={`loading-thread-${i}`} />
              ))}
            </div>
          ) : !userThreads.length ? (
            <p className="text-gray-400 text-sm text-center py-4">
              No conversations yet
            </p>
          ) : (
            Object.entries(groupedThreads).map(([group, threads]) =>
              threads.length > 0 ? (
                <div key={group}>
                  <TighterText className="text-xs font-medium text-gray-400 mb-2 px-2">
                    {prettifyDateLabel(group)}
                  </TighterText>
                  <div className="space-y-1">
                    {threads
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((thread) => (
                        <ThreadItem
                          key={thread.thread_id}
                          id={thread.thread_id}
                          label={
                            thread.metadata?.thread_title ??
                            ((thread.values as Record<string, any>)
                              ?.messages?.[0]?.content ||
                              "Untitled")
                          }
                          isActive={currentThreadId === thread.thread_id}
                          onClick={() => {
                            switchSelectedThreadCallback(thread);
                            setIsMobileOpen(false);
                          }}
                          onDelete={() => handleDeleteThread(thread.thread_id)}
                        />
                      ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 space-y-2">
        {/* Settings */}
        {!isCollapsed && <SettingsDialog user={user} />}
        
        {/* User Info & Logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {user?.email || ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isCollapsed && <SettingsDialog user={user} isCollapsed />}
            <TooltipIconButton
              tooltip="Logout"
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </TooltipIconButton>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block fixed top-4 left-4 z-40 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
        style={{
          left: isCollapsed ? "4.5rem" : "16.5rem",
          transition: "left 0.3s ease-in-out",
        }}
      >
        {isCollapsed ? (
          <PanelLeft className="w-5 h-5" />
        ) : (
          <PanelLeftClose className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={`hidden lg:block h-screen flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
