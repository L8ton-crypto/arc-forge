"use client";

import { useState } from "react";
import { Priority, ColumnId, COLUMN_CONFIG } from "@/lib/types";

interface AddTaskModalProps {
  targetColumn: ColumnId;
  onClose: () => void;
  onAdd: (task: {
    title: string;
    description: string;
    priority: Priority;
    tags: string[];
    estimatedHours?: number;
    monetization?: string;
    requirements?: string;
  }, columnId: ColumnId) => void;
}

export default function AddTaskModal({ targetColumn, onClose, onAdd }: AddTaskModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    tags: "",
    estimatedHours: "",
    monetization: "",
    requirements: "",
    column: targetColumn,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onAdd(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
        monetization: form.monetization.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
      },
      form.column
    );
    onClose();
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors";
  const labelClass = "text-[10px] uppercase tracking-wider text-gray-500 mb-1 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          <label className={labelClass}>Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            placeholder="App name or task title"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputClass} min-h-[70px] resize-y`}
            placeholder="What does this app/task do?"
          />
        </div>

        {/* Requirements */}
        <div className="mb-3">
          <label className={labelClass}>📝 Requirements / Steering Notes</label>
          <textarea
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            className={`${inputClass} min-h-[60px] resize-y`}
            placeholder="Add constraints or direction for Arc..."
          />
        </div>

        {/* Priority & Hours */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className={inputClass}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Estimated Hours</label>
            <input
              type="number"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
              className={inputClass}
              placeholder="Hours"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className={inputClass}
            placeholder="saas, fintech, freemium"
          />
        </div>

        {/* Monetization */}
        <div className="mb-3">
          <label className={labelClass}>Revenue Model</label>
          <input
            value={form.monetization}
            onChange={(e) => setForm({ ...form, monetization: e.target.value })}
            className={inputClass}
            placeholder="e.g. Freemium SaaS — £5/mo pro tier"
          />
        </div>

        {/* Target Column */}
        <div className="mb-5">
          <label className={labelClass}>Add to Column</label>
          <select
            value={form.column}
            onChange={(e) => setForm({ ...form, column: e.target.value as ColumnId })}
            className={inputClass}
          >
            {COLUMN_CONFIG.map((col) => (
              <option key={col.id} value={col.id}>
                {col.emoji} {col.title}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
