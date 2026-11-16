"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Plus, Search, CheckSquare, Square, Trash2, Edit3, Calendar, DollarSign, Clock, Users } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/admin/modal";

const PRIORITY_BADGES = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-amber-100 text-amber-800 font-bold",
  urgent: "bg-red-100 text-red-800 font-bold",
};

const STATUS_BADGES = {
  planning: "bg-purple-100 text-purple-800",
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800 font-semibold",
  on_hold: "bg-orange-100 text-orange-800",
  completed: "bg-emerald-100 text-emerald-800 font-bold",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    clientName: "",
    category: "Software Development",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    deadline: "",
    budget: 35000,
    priority: "medium",
  });

  const fetchProjects = () => {
    setLoading(true);
    fetch(`/api/admin/projects?status=${statusFilter}&search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const handleToggleTask = async (projectId, taskId) => {
    try {
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, taskToggleId: taskId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProject(data.project);
        fetchProjects();
      }
    } catch {}
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;

    try {
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedProject.id, newTaskTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle("");
        setSelectedProject(data.project);
        fetchProjects();
      }
    } catch {}
  };

  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: newStatus }),
      });
      if (res.ok) {
        fetchProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject({ ...selectedProject, status: newStatus });
        }
      }
    } catch {}
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: "",
          clientName: "",
          category: "Software Development",
          description: "",
          startDate: new Date().toISOString().split("T")[0],
          deadline: "",
          budget: 35000,
          priority: "medium",
        });
        fetchProjects();
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/projects?id=${deleteTargetId}`, { method: "DELETE" });
      setDeleteTargetId(null);
      if (selectedProject?.id === deleteTargetId) setSelectedProject(null);
      fetchProjects();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Project Delivery &amp; Milestones
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tracking development sprints, deliverables, client budgets, and task completion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute inset-y-0 left-3 my-auto text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, client, category..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-[#f5c518] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5c518]"
        >
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading delivery projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">No projects found.</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${PRIORITY_BADGES[p.priority] || "bg-gray-100"}`}>
                    {p.priority} Priority
                  </span>
                  <select
                    value={p.status}
                    onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold border-none capitalize focus:outline-none ${STATUS_BADGES[p.status] || "bg-gray-100"}`}
                  >
                    <option value="planning">Planning</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <h3 className="font-bold text-base text-gray-900 mt-2">{p.title}</h3>
                <p className="text-xs text-gray-500">Client: <span className="font-semibold text-gray-800">{p.clientName}</span> · {p.category}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">{p.description}</p>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Sprint Completion</span>
                    <span className="font-mono font-bold text-gray-900">{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div style={{ width: `${p.progress}%` }} className="h-full rounded-full bg-[#f5c518]" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-50 pt-3">
                  <span>Budget: <strong className="text-emerald-700 font-mono">${(p.budget || 0).toLocaleString()}</strong></span>
                  <span>Tasks: <strong>{(p.tasks || []).filter((t) => t.completed).length}/{(p.tasks || []).length}</strong></span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedProject(p)}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-[#29251b] hover:text-[#f5c518] transition"
                >
                  Manage Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(p.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Breakdown Modal */}
      {selectedProject && (
        <Modal
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={`Project Workspace: ${selectedProject.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Client</span>
                <p className="font-bold text-gray-900">{selectedProject.clientName}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Overall Progress</span>
                <p className="font-bold text-emerald-700 text-sm font-mono">{selectedProject.progress}%</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Deadline</span>
                <p className="font-semibold text-gray-800">{selectedProject.deadline || "TBD"}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Milestone Tasks &amp; Deliverables</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
                {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                  <p className="text-gray-400 italic">No tasks created for this project yet.</p>
                ) : (
                  selectedProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(selectedProject.id, task.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer ${
                        task.completed ? "bg-emerald-50/50 border-emerald-100 text-gray-500 line-through" : "bg-white border-gray-100 text-gray-800"
                      }`}
                    >
                      {task.completed ? (
                        <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-gray-400 shrink-0" />
                      )}
                      <span className="font-medium flex-1">{task.title}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add new task (e.g. AWS CI/CD pipeline setup)..."
                  className="flex-1 rounded-xl border border-gray-200 p-2 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#29251b] px-4 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
                >
                  Add Task
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Delivery Project"
        >
          <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. AI-Powered Healthcare Dashboard"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.clientName}
                  onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                  placeholder="Acme Global"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="AI & ML Development">AI & ML Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Budget ($)</label>
                <input
                  type="number"
                  value={createForm.budget}
                  onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={createForm.deadline}
                  onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Project Scope &amp; Architecture</label>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="High-level solution overview, key architecture, deliverables..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#29251b] px-5 py-2 font-bold text-[#f5c518] hover:bg-[#181613]"
              >
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? Associated milestones and task logs will be removed."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
