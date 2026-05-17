"use client";

import { useState } from "react";
import { Priority, ColumnId, COLUMN_CONFIG, Audience, Task } from "@/lib/types";

interface AddTaskModalProps {
  targetColumn: ColumnId;
  onClose: () => void;
  onAdd: (task: Omit<Task, "id" | "createdAt" | "updatedAt">, columnId: ColumnId) => void;
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
    audience: "" as "" | Audience,
    liveUrl: "",
    repoUrl: "",
    oneNightScope: "",
    weekTwoScope: "",
    competitorCheck: "",
    sourceSignal: "",
    column: targetColumn,
  });
  const [showPipeline, setShowPipeline] = useState(false);

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
        audience: form.audience || undefined,
        liveUrl: form.liveUrl.trim() || undefined,
        repoUrl: form.repoUrl.trim() || undefined,
        oneNightScope: form.oneNightScope.trim() || undefined,
        weekTwoScope: form.weekTwoScope.trim() || undefined,
        competitorCheck: form.competitorCheck.trim() || undefined,
        sourceSignal: form.sourceSignal.trim() || undefined,
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

        {/* Pipeline fields - collapsible to keep the modal lean for everyday tasks */}
        <div className="mb-3 border-t border-gray-800 pt-3">
          <button
            type="button"
            onClick={() => setShowPipeline(!showPipeline)}
            className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors mb-2"
          >
            <span>🔧 Pipeline fields (app ideas / shipped apps)</span>
            <span className="text-gray-600">{showPipeline ? "−" : "+"}</span>
          </button>

          {showPipeline && (
            <div className="space-y-3 bg-gray-800/30 rounded-lg p-3 border border-gray-800">
              <div>
                <label className={labelClass}>Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as "" | Audience })}
                  className={inputClass}
                >
                  <option value="">— none —</option>
                  <option value="appian">Appian (day-job audience)</option>
                  <option value="finance">Finance (retail trading)</option>
                  <option value="consumer">Consumer</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>🌙 One-night MVP scope</label>
                <textarea
                  value={form.oneNightScope}
                  onChange={(e) => setForm({ ...form, oneNightScope: e.target.value })}
                  className={`${inputClass} min-h-[60px] resize-y`}
                  placeholder="Exactly what ships in 8 hours - one page, one endpoint, one feature"
                />
              </div>

              <div>
                <label className={labelClass}>📅 Week-two scope</label>
                <textarea
                  value={form.weekTwoScope}
                  onChange={(e) => setForm({ ...form, weekTwoScope: e.target.value })}
                  className={`${inputClass} min-h-[50px] resize-y`}
                  placeholder="What gets added in iteration 2 if MVP gets traction"
                />
              </div>

              <div>
                <label className={labelClass}>🔍 Competitor check</label>
                <textarea
                  value={form.competitorCheck}
                  onChange={(e) => setForm({ ...form, competitorCheck: e.target.value })}
                  className={`${inputClass} min-h-[50px] resize-y`}
                  placeholder="Found X variants on Product Hunt or GitHub. We differentiate by Y."
                />
              </div>

              <div>
                <label className={labelClass}>📡 Source signal</label>
                <input
                  value={form.sourceSignal}
                  onChange={(e) => setForm({ ...form, sourceSignal: e.target.value })}
                  className={inputClass}
                  placeholder="URL to forum thread, news story, or friction cluster"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>🟢 Live URL</label>
                  <input
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://app.vercel.app"
                  />
                </div>
                <div>
                  <label className={labelClass}>📦 Repo URL</label>
                  <input
                    value={form.repoUrl}
                    onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>
          )}
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
