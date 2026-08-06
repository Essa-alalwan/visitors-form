import type { ReactNode } from "react";
import logo from "../../assets/logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-primary-50 via-slate-50 to-slate-100">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <img
            src={logo}
            alt="Aldur II IWPP Access Portal — Digital Visitor, Material & Equipment Permit Workflow, ACWA Operations"
            className="h-auto w-full rounded-2xl shadow-sm"
          />
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 flex flex-col items-center gap-1 pb-2 text-center text-xs text-slate-400">
          <p>Powered by Aldurgen Digital Solutions | ACWA Operations</p>
          <p>Web App Version: V1.0</p>
        </footer>
      </div>
    </div>
  );
}
