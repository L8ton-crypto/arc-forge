import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "L8 — Autonomous Overnight Pipeline",
  description: "Live view of every app shipped via the autonomous build pipeline.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
