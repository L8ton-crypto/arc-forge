export type Priority = "high" | "medium" | "low";
export type ColumnId = "backlog" | "requirements" | "in-progress" | "review" | "complete";
export type Audience = "appian" | "finance" | "consumer" | "enterprise";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  monetization?: string;
  requirements?: string;
  // Pipeline / public-dashboard fields (all optional, backwards compatible)
  audience?: Audience;
  liveUrl?: string;
  repoUrl?: string;
  shippedAt?: string;
  oneNightScope?: string;
  weekTwoScope?: string;
  competitorCheck?: string;
  sourceSignal?: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  emoji: string;
  tasks: Task[];
}

export const COLUMN_CONFIG: { id: ColumnId; title: string; emoji: string }[] = [
  { id: "backlog", title: "Backlog", emoji: "📋" },
  { id: "requirements", title: "Requirements", emoji: "📝" },
  { id: "in-progress", title: "In Progress", emoji: "⚡" },
  { id: "review", title: "Review", emoji: "🔍" },
  { id: "complete", title: "Complete", emoji: "✅" },
];

export const COLUMN_ORDER: ColumnId[] = ["backlog", "requirements", "in-progress", "review", "complete"];

export const AUDIENCE_CONFIG: Record<Audience, { label: string; bg: string; text: string; border: string }> = {
  appian: { label: "Appian", bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
  finance: { label: "Finance", bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30" },
  consumer: { label: "Consumer", bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30" },
  enterprise: { label: "Enterprise", bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30" },
};
