import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Filter, 
  Search,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';
import { Task, User } from '../types/index.js';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'slate' },
  { id: 'todo', label: 'To Do', color: 'indigo' },
  { id: 'in_progress', label: 'In Progress', color: 'amber' },
  { id: 'in_review', label: 'In Review', color: 'cyan' },
  { id: 'done', label: 'Done', color: 'emerald' }
];

export const SprintKanban: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [newTaskStatus, setNewTaskStatus] = useState<'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'>('todo');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('usr_marcus');

  const loadTasks = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        api.getTasks(),
        api.getUsers()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTasks();

    // Listen to real-time collaborative updates across clients
    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks(prev => {
        const exists = prev.some(t => t.id === updatedTask.id);
        if (exists) {
          return prev.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
        } else {
          return [updatedTask, ...prev];
        }
      });
    };

    socket.on('task:updated', handleTaskUpdated);
    return () => {
      socket.off('task:updated');
    };
  }, []);

  const handleMoveTask = async (taskId: string, targetStatus: string) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: targetStatus as any } : t)));

    // Emit via WebSocket for instant synchronization across tabs
    socket.emit('task:move', { taskId, newStatus: targetStatus, orderIdx: 0 });

    try {
      await api.updateTask(taskId, { status: targetStatus });
    } catch (e) {
      console.error(e);
      loadTasks(); // rollback on failure
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (e) {
      console.error(e);
      loadTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await api.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority,
        status: newTaskStatus,
        assignee_id: newTaskAssignee,
        sprint: 'Sprint 42'
      });

      setTasks(prev => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Collaborative Sprint OS</h1>
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
              SPRINT 42
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tab collaborative Kanban. Drag, assign, and track engineering tasks with zero latency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-dark-850 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64 transition-all"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col min-h-[550px] bg-dark-900/40"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      col.color === 'emerald'
                        ? 'bg-emerald-400'
                        : col.color === 'amber'
                        ? 'bg-amber-400'
                        : col.color === 'cyan'
                        ? 'bg-cyan-400'
                        : col.color === 'indigo'
                        ? 'bg-indigo-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {col.label}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 bg-dark-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map(task => {
                  const priorityColor =
                    task.priority === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : task.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : task.priority === 'medium'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-500/30';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-dark-850 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-950/20 transition-all duration-150 group"
                    >
                      {/* Priority and Incident link */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${priorityColor}`}>
                          {task.priority}
                        </span>
                        {task.incident_severity && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <Flame className="w-2.5 h-2.5" />
                            {task.incident_severity} Incident
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Card Footer: Assignee & Move Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assignee_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt={task.assignee_name || 'Assignee'}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                            title={task.assignee_name || 'Assigned'}
                          />
                          <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                            {task.assignee_name?.split(' ')[0] || 'Unassigned'}
                          </span>
                        </div>

                        {/* Move Actions */}
                        <div className="flex items-center gap-1">
                          <select
                            value={task.status}
                            onChange={e => handleMoveTask(task.id, e.target.value)}
                            className="bg-dark-900 border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>
                                → {c.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Engineering Task</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add task to current sprint. Changes sync in real-time to all connected teammates.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize Redis session serialization with MessagePack"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Acceptance criteria or architectural considerations..."
                  value={newTaskDesc}
                  onChange={e => setNewTaskDesc(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-dark-850 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Status</label>
                  <select
                    value={newTaskStatus}
                    onChange={e => setNewTaskStatus(e.target.value as any)}
                    className="w-full bg-dark-850 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                    className="w-full bg-dark-850 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
