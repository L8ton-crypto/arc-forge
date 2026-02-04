"use client";

import { Task, Priority } from "@/lib/types";

const priorityColors: Record<Priority, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-blue-500",
};

const priorityBadge: Record<Priority, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-red-500/10", text: "text-red-400", label: "High" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Med" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Low" },
};

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  const pColor = priorityColors[task.priority];
  const badge = priorityBadge[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className={`card-drag bg-gray-800/80 backdrop-blur border-l-4 ${pColor} rounded-lg p-3 mb-2 hover:bg-gray-750 hover:shadow-lg hover:shadow-black/20 transition-all duration-150 group cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm text-gray-100 group-hover:text-white leading-tight">
          {task.title}
        </h3>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} shrink-0`}>
          {badge.label}
        </span>
      </div>
      <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
        {task.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
      {task.monetization && (
        <div className="mt-2 text-[10px] text-emerald-400/80 flex items-center gap-1">
          <span>💰</span>
          <span>{task.monetization}</span>
        </div>
      )}
    </div>
  );
}
