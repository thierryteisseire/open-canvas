"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { User } from "@/contexts/UserContext";
import { useState } from "react";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";

interface SettingsDialogProps {
  user: User | undefined;
  isCollapsed?: boolean;
}

export function SettingsDialog({ user, isCollapsed }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isCollapsed ? (
          <TooltipIconButton
            tooltip="Settings"
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Settings className="w-4 h-4" />
          </TooltipIconButton>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            View your account information and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user?.name || "Not set"}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || "Not set"}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              value={user?.id || "Not set"}
              disabled
              className="bg-gray-50 font-mono text-xs"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
