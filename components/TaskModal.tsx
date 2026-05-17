"use client";

import { useState, useEffect } from "react";
import { Task, Priority, ColumnId, COLUMN_CONFIG, COLUMN_ORDER, Audience, AUDIENCE_CONFIG } from "@/lib/types";

interface TaskModalProps {
  task: Task | null;
  columnId: ColumnId | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, targetCol: ColumnId) => void;
  canEdit?: boolean;
}

export default function TaskModal({ task, columnId, onClose, onSave, onDelete, onMove, canEdit = true }: TaskModalProps) {
  const [editing, setEditing] = useState(false);
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
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        priority: task.priority,
        tags: task.tags.join(", "),
        estimatedHours: task.estimatedHours?.toString() || "",
        monetization: task.monetization || "",
        requirements: task.requirements || "",
        audience: task.audience || "",
        liveUrl: task.liveUrl || "",
        repoUrl: task.repoUrl || "",
        oneNightScope: task.oneNightScope || "",
        weekTwoScope: task.weekTwoScope || "",
        competitorCheck: task.competitorCheck || "",
        sourceSignal: task.sourceSignal || "",
      });
      setEditing(false);
      setConfirmDelete(false);
      setShowPipeline(
        !!(task.audience || task.liveUrl || task.repoUrl || task.oneNightScope ||
           task.weekTwoScope || task.competitorCheck || task.sourceSignal || task.shippedAt)
      );
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    const today = new Date().toISOString().split("T")[0];
    onSave({
      ...task,
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
      updatedAt: today,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(task.id);
    onClose();
  };

  const currentIdx = columnId ? COLUMN_ORDER.indexOf(columnId) : -1;
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < COLUMN_ORDER.length - 1;

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors";
  const labelClass = "text-[10px] uppercase tracking-wider text-gray-500 mb-1 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {editing ? (
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`${inputClass} text-lg font-bold`}
              placeholder="Task title"
            />
          ) : (
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none p-1 ml-3 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Description */}
        {editing ? (
          <div className="mb-4">
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Task description"
            />
          </div>
        ) : (
          <p className="text-gray-300 text-sm mb-4 leading-relaxed">{task.description}</p>
        )}

        {/* Requirements */}
        <div className="mb-4">
          <label className={labelClass}>📝 Requirements / Steering Notes</label>
          {editing ? (
            <textarea
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Add requirements, constraints, or direction for Arc to follow..."
            />
          ) : (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 min-h-[40px]">
              {task.requirements ? (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.requirements}</p>
              ) : (
                <p className="text-xs text-gray-600 italic">No requirements set. Click Edit to add steering notes.</p>
              )}
            </div>
          )}
        </div>

        {/* Priority & Estimated Hours */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {editing ? (
            <>
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
            </>
          ) : (
            <>
              <div className="bg-gray-800 rounded-lg p-3">
                <div className={labelClass}>Priority</div>
                <div className={`text-sm font-medium ${
                  task.priority === "high" ? "text-red-400" :
                  task.priority === "medium" ? "text-amber-400" : "text-blue-400"
                }`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </div>
              </div>
              {task.estimatedHours && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className={labelClass}>Estimated</div>
                  <div className="text-sm text-gray-200">{task.estimatedHours}h</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tags */}
        {editing ? (
          <div className="mb-4">
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className={inputClass}
              placeholder="saas, fintech, freemium"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Monetization */}
        {editing ? (
          <div className="mb-4">
            <label className={labelClass}>Revenue Model</label>
            <input
              value={form.monetization}
              onChange={(e) => setForm({ ...form, monetization: e.target.value })}
              className={inputClass}
              placeholder="e.g. Freemium SaaS — £5/mo pro tier"
            />
          </div>
        ) : task.monetization ? (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-emerald-500/70 mb-1">Revenue Model</div>
            <div className="text-sm text-emerald-300">{task.monetization}</div>
          </div>
        ) : null}

        {/* Pipeline section - collapsible. Auto-expands when any pipeline field is set. */}
        <div className="mb-4 border-t border-gray-800 pt-3">
          <button
            type="button"
            onClick={() => setShowPipeline(!showPipeline)}
            className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors mb-2"
          >
            <span>🔧 Pipeline fields</span>
            <span className="text-gray-600">{showPipeline ? "−" : "+"}</span>
          </button>

          {showPipeline && (
            <div className="space-y-3 bg-gray-800/30 rounded-lg p-3 border border-gray-800">
              <div>
                <div className={labelClass}>Audience</div>
                {editing ? (
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
                ) : task.audience ? (
                  (() => {
                    const a = AUDIENCE_CONFIG[task.audience];
                    return (
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${a.bg} ${a.text} ${a.border} font-medium`}
                      >
                        {a.label}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-xs text-gray-600 italic">— not set —</span>
                )}
              </div>

              <div>
                <div className={labelClass}>🌙 One-night MVP scope</div>
                {editing ? (
                  <textarea
                    value={form.oneNightScope}
                    onChange={(e) => setForm({ ...form, oneNightScope: e.target.value })}
                    className={`${inputClass} min-h-[60px] resize-y`}
                    placeholder="Exactly what ships in 8 hours - one page, one endpoint, one feature"
                  />
                ) : task.oneNightScope ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.oneNightScope}</p>
                ) : (
                  <span className="text-xs text-gray-600 italic">— not set —</span>
                )}
              </div>

              <div>
                <div className={labelClass}>📅 Week-two scope</div>
                {editing ? (
                  <textarea
                    value={form.weekTwoScope}
                    onChange={(e) => setForm({ ...form, weekTwoScope: e.target.value })}
                    className={`${inputClass} min-h-[50px] resize-y`}
                    placeholder="What gets added in iteration 2 if MVP gets traction"
                  />
                ) : task.weekTwoScope ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.weekTwoScope}</p>
                ) : (
                  <span className="text-xs text-gray-600 italic">— not set —</span>
                )}
              </div>

              <div>
                <div className={labelClass}>🔍 Competitor check</div>
                {editing ? (
                  <textarea
                    value={form.competitorCheck}
                    onChange={(e) => setForm({ ...form, competitorCheck: e.target.value })}
                    className={`${inputClass} min-h-[50px] resize-y`}
                    placeholder="Found X variants on Product Hunt or GitHub. We differentiate by Y."
                  />
                ) : task.competitorCheck ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.competitorCheck}</p>
                ) : (
                  <span className="text-xs text-gray-600 italic">— not set —</span>
                )}
              </div>

              <div>
                <div className={labelClass}>📡 Source signal</div>
                {editing ? (
                  <input
                    value={form.sourceSignal}
                    onChange={(e) => setForm({ ...form, sourceSignal: e.target.value })}
                    className={inputClass}
                    placeholder="URL to forum thread, news story, or friction cluster"
                  />
                ) : task.sourceSignal ? (
                  /^https?:\/\//.test(task.sourceSignal) ? (
                    <a
                      href={task.sourceSignal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {task.sourceSignal}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.sourceSignal}</p>
                  )
                ) : (
                  <span className="text-xs text-gray-600 italic">— not set —</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={labelClass}>🟢 Live URL</div>
                  {editing ? (
                    <input
                      value={form.liveUrl}
                      onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                      className={inputClass}
                      placeholder="https://app.vercel.app"
                    />
                  ) : task.liveUrl ? (
                    <a
                      href={task.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-300 hover:text-emerald-200 underline break-all"
                    >
                      {task.liveUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-600 italic">— not set —</span>
                  )}
                </div>
                <div>
                  <div className={labelClass}>📦 Repo URL</div>
                  {editing ? (
                    <input
                      value={form.repoUrl}
                      onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                      className={inputClass}
                      placeholder="https://github.com/..."
                    />
                  ) : task.repoUrl ? (
                    <a
                      href={task.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {task.repoUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-600 italic">— not set —</span>
                  )}
                </div>
              </div>

              {task.shippedAt && (
                <div className="text-[11px] text-emerald-400/70 pt-1 border-t border-gray-800/60">
                  🚢 Shipped {new Date(task.shippedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Move buttons (mobile-friendly) - only when can edit */}
        {canEdit && (
          <div className="flex gap-2 mb-4">
            {canMoveLeft && (
              <button
                onClick={() => {
                  onMove(task.id, COLUMN_ORDER[currentIdx - 1]);
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                ← {COLUMN_CONFIG[currentIdx - 1]?.emoji} {COLUMN_CONFIG[currentIdx - 1]?.title}
              </button>
            )}
            {canMoveRight && (
              <button
                onClick={() => {
                  onMove(task.id, COLUMN_ORDER[currentIdx + 1]);
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                {COLUMN_CONFIG[currentIdx + 1]?.emoji} {COLUMN_CONFIG[currentIdx + 1]?.title} →
              </button>
            )}
          </div>
        )}

        {/* Action buttons - only show edit/delete when canEdit */}
        {canEdit && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setConfirmDelete(false); }}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            <button
              onClick={handleDelete}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                confirmDelete
                  ? "bg-red-600 hover:bg-red-500 text-white font-medium"
                  : "bg-gray-800 hover:bg-gray-700 text-red-400"
              }`}
            >
              {confirmDelete ? "Confirm Delete" : "🗑️ Delete"}
            </button>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-3 text-[10px] text-gray-600">
          Created: {task.createdAt} · Updated: {task.updatedAt}
        </div>
      </div>
    </div>
  );
}
