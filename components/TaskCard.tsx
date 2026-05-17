"use client";

import { Task, Priority, AUDIENCE_CONFIG } from "@/lib/types";

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
  const audience = task.audience ? AUDIENCE_CONFIG[task.audience] : null;

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
        {audience && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${audience.bg} ${audience.text} ${audience.border} font-medium`}
          >
            {audience.label}
          </span>
        )}
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        {task.monetization && (
          <div className="text-[10px] text-emerald-400/80 flex items-center gap-1">
            <span>💰</span>
            <span>{task.monetization}</span>
          </div>
        )}
        {task.oneNightScope && (
          <div className="text-[10px] text-amber-400/80 flex items-center gap-1" title={task.oneNightScope}>
            <span>🌙</span>
            <span>1-night scope</span>
          </div>
        )}
        {task.liveUrl && (
          <div className="text-[10px] text-emerald-300 flex items-center gap-1">
            <span>🟢</span>
            <span>Live</span>
          </div>
        )}
        {task.requirements && (
          <div className="text-[10px] text-blue-400/80 flex items-center gap-1 ml-auto">
            <span>📝</span>
            <span>Reqs</span>
          </div>
        )}
      </div>
    </div>
  );
}
