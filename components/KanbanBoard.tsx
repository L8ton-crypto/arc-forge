"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Column, ColumnId, Task, COLUMN_CONFIG, COLUMN_ORDER } from "@/lib/types";
import { initialColumns } from "@/lib/initial-data";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import AddTaskModal from "./AddTaskModal";

const STORAGE_KEY = "arc-forge-board";

// Load from localStorage as fallback
function loadFromStorage(): Column[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

// Save to localStorage as backup
function saveToStorage(columns: Column[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}

// Load from server API
async function loadFromServer(): Promise<Column[] | null> {
  try {
    const res = await fetch("/api/board");
    const data = await res.json();
    return data.columns || null;
  } catch {
    return null;
  }
}

// Save to server API
async function saveToServer(columns: Column[]): Promise<boolean> {
  try {
    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskCol, setSelectedTaskCol] = useState<ColumnId | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load board on mount: server > localStorage > initial
  useEffect(() => {
    async function load() {
      const serverData = await loadFromServer();
      if (serverData) {
        setColumns(serverData);
        saveToStorage(serverData); // sync to localStorage
      } else {
        const localData = loadFromStorage();
        if (localData) {
          setColumns(localData);
          // Push local data to server if server was empty
          saveToServer(localData);
        }
      }
      setMounted(true);
    }
    load();
  }, []);

  // Auto-save on every change (debounced 500ms)
  useEffect(() => {
    if (!mounted) return;

    // Save to localStorage immediately
    saveToStorage(columns);

    // Debounce server save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      setSyncing(true);
      const success = await saveToServer(columns);
      setSyncing(false);
      if (success) {
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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

  // Task CRUD
  const handleTaskClick = useCallback((task: Task, columnId: ColumnId) => {
    setSelectedTask(task);
    setSelectedTaskCol(columnId);
  }, []);

  const handleSaveTask = useCallback((updatedTask: Task) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      }))
    );
    setSelectedTask(updatedTask);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
  }, []);

  const handleMoveTask = useCallback((taskId: string, targetColId: ColumnId) => {
    setColumns((prev) => {
      let task: Task | null = null;
      const newCols = prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => {
          if (t.id === taskId) {
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
  }, []);

  const handleAddTask = useCallback(
    (
      taskData: {
        title: string;
        description: string;
        priority: "high" | "medium" | "low";
        tags: string[];
        estimatedHours?: number;
        monetization?: string;
        requirements?: string;
      },
      columnId: ColumnId
    ) => {
      const today = new Date().toISOString().split("T")[0];
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        createdAt: today,
        updatedAt: today,
      };
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      );
    },
    []
  );

  // Filtering
  const filterTasks = useCallback(
    (tasks: Task[]) => {
      return tasks.filter((t) => {
        const matchesSearch =
          !searchQuery ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
        return matchesSearch && matchesPriority;
      });
    },
    [searchQuery, filterPriority]
  );

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const completedTasks = columns.find((c) => c.id === "complete")?.tasks.length || 0;
  const inProgress = columns.find((c) => c.id === "in-progress")?.tasks.length || 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                ⚡
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Arc Forge</h1>
                <p className="text-[11px] text-gray-500">Overnight App Factory</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-40"
              />
              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All priorities</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {inProgress} active
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {completedTasks}/{totalTasks} done
                </div>
                {/* Sync status */}
                <div className="flex items-center gap-1.5 text-gray-500">
                  {syncing ? (
                    <span className="text-[10px]">💾 Saving...</span>
                  ) : lastSaved ? (
                    <span className="text-[10px]">✓ {lastSaved}</span>
                  ) : null}
                </div>
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
            const filteredTasks = filterTasks(col.tasks);

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
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500 bg-gray-800/60 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {col.tasks.length}
                      </span>
                      <button
                        onClick={() => setAddingToColumn(col.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-gray-800 transition-colors text-sm"
                        title={`Add task to ${config.title}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-2 kanban-column">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onClick={(t) => handleTaskClick(t, col.id)}
                    />
                  ))}
                  {filteredTasks.length === 0 && col.tasks.length > 0 && (
                    <div className="text-center py-8 text-gray-600 text-xs">
                      No matching tasks
                    </div>
                  )}
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
      <TaskModal
        task={selectedTask}
        columnId={selectedTaskCol}
        onClose={() => { setSelectedTask(null); setSelectedTaskCol(null); }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onMove={handleMoveTask}
      />

      {/* Add task modal */}
      {addingToColumn && (
        <AddTaskModal
          targetColumn={addingToColumn}
          onClose={() => setAddingToColumn(null)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
}
