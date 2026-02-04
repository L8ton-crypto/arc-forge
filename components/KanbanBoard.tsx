"use client";

import { useState, useCallback, useEffect } from "react";
import { Column, ColumnId, Task, COLUMN_CONFIG } from "@/lib/types";
import { initialColumns } from "@/lib/initial-data";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";

const STORAGE_KEY = "arc-forge-board";

function loadBoard(): Column[] {
  if (typeof window === "undefined") return initialColumns;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return initialColumns;
}

function saveBoard(columns: Column[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setColumns(loadBoard());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveBoard(columns);
  }, [columns, mounted]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColId: ColumnId) => {
      e.preventDefault();
      setDragOverCol(null);

      if (!draggedTask) return;

      setColumns((prev) => {
        let task: Task | null = null;
        const newCols = prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => {
            if (t.id === draggedTask) {
              task = { ...t, updatedAt: new Date().toISOString().split("T")[0] };
              return false;
            }
            return true;
          }),
        }));

        if (!task) return prev;

        return newCols.map((col) =>
          col.id === targetColId ? { ...col, tasks: [...col.tasks, task!] } : col
        );
      });

      setDraggedTask(null);
    },
    [draggedTask]
  );

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const completedTasks = columns.find((c) => c.id === "complete")?.tasks.length || 0;
  const inProgress = columns.find((c) => c.id === "in-progress")?.tasks.length || 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                ⚡
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Arc Forge</h1>
                <p className="text-[11px] text-gray-500">Overnight App Factory</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {inProgress} active
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {completedTasks}/{totalTasks} done
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const config = COLUMN_CONFIG.find((c) => c.id === col.id)!;
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-72 rounded-xl border transition-colors duration-150 ${
                  isOver
                    ? "border-blue-500/30 bg-blue-500/5"
                    : "border-gray-800/50 bg-gray-900/30"
                }`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className="px-3 py-3 border-b border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{config.emoji}</span>
                      <span className="text-sm font-semibold text-gray-200">{config.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 bg-gray-800/60 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {col.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-2 kanban-column">
                  {col.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onClick={setSelectedTask}
                    />
                  ))}
                  {col.tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-xs">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Task detail modal */}
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
