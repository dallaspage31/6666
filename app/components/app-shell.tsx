"use client";

import { ReactNode } from "react";
import { AppHeader } from "./app-header";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        ROBHEROES &copy; 2026
      </footer>
    </div>
  );
}
