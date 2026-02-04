export type Priority = "high" | "medium" | "low";
export type ColumnId = "backlog" | "requirements" | "in-progress" | "review" | "complete";

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
