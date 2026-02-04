"use client";

import { Task } from "@/lib/types";

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskModal({ task, onClose }: TaskModalProps) {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none p-1"
          >
            ×
          </button>
        </div>

        <p className="text-gray-300 text-sm mb-4 leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Priority</div>
            <div className={`text-sm font-medium ${
              task.priority === "high" ? "text-red-400" :
              task.priority === "medium" ? "text-amber-400" : "text-blue-400"
            }`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </div>
          </div>
          {task.estimatedHours && (
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Estimated</div>
              <div className="text-sm text-gray-200">{task.estimatedHours}h</div>
            </div>
          )}
        </div>

        {task.monetization && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-emerald-500/70 mb-1">Revenue Model</div>
            <div className="text-sm text-emerald-300">{task.monetization}</div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-600">
          Created: {task.createdAt} · Updated: {task.updatedAt}
        </div>
      </div>
    </div>
  );
}
