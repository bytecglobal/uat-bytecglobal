"use client";

import { useState, useEffect } from "react";
import { KanbanSquare, Plus, ArrowRight, UserCheck, DollarSign, Building2, Mail, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/admin/modal";

const STAGES = [
  { id: "new", label: "New Leads", color: "border-amber-400 bg-amber-50/40" },
  { id: "contacted", label: "Contacted", color: "border-blue-400 bg-blue-50/40" },
  { id: "qualified", label: "Qualified", color: "border-purple-400 bg-purple-50/40" },
  { id: "proposal_sent", label: "Proposal Sent", color: "border-indigo-400 bg-indigo-50/40" },
  { id: "won", label: "Won (Clients)", color: "border-emerald-400 bg-emerald-50/40" },
  { id: "lost", label: "Lost", color: "border-gray-400 bg-gray-50/40" },
];

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    companyName: "",
    service: "Software Development",
    estimatedValue: 20000,
    stage: "new",
  });

  const fetchLeads = () => {
    setLoading(true);
    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId, newStage) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
      if (res.ok) fetchLeads();
    } catch {}
  };

  const handleConvertToClient = async (leadId) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert_to_client", leadId }),
      });
      if (res.ok) {
        alert("Lead successfully converted to corporate Client dossier!");
        fetchLeads();
        setSelectedLead(null);
      }
    } catch {}
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewLeadForm({
          name: "",
          email: "",
          companyName: "",
          service: "Software Development",
          estimatedValue: 20000,
          stage: "new",
        });
        fetchLeads();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 font-display">
            Lead Pipeline &amp; CRM Funnel
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Visual Kanban management of qualified prospect opportunities and customer conversions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#29251b] px-4 py-2 text-xs font-semibold text-[#f5c518] hover:bg-[#181613] transition shadow-xs"
        >
          <Plus size={15} />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const totalVal = stageLeads.reduce((acc, curr) => acc + (Number(curr.estimatedValue) || 0), 0);

          return (
            <div
              key={stage.id}
              className={`flex flex-col rounded-2xl border ${stage.color} p-3 min-w-[210px] bg-white shadow-xs`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase font-mono">{stage.label}</h3>
                  <div className="text-[10px] text-gray-400 font-semibold font-mono">
                    ${totalVal.toLocaleString()}
                  </div>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards in Column */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[65vh]">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-gray-400 italic">Empty Stage</div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="group rounded-xl border border-gray-200/80 bg-white p-3 shadow-xs hover:border-[#f5c518] hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-xs text-gray-900 group-hover:text-[#806000] truncate">
                          {lead.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          ${(Number(lead.estimatedValue) || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 truncate mb-1">
                        {lead.companyName || lead.email}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 pt-2 mt-2">
                        <span className="truncate max-w-[110px]">{lead.service}</span>
                        <select
                          value={lead.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className="rounded border border-gray-200 bg-gray-50 text-[10px] text-gray-700 font-medium py-0.5"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              &rarr; {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail / Conversion Modal */}
      {selectedLead && (
        <Modal
          isOpen={Boolean(selectedLead)}
          onClose={() => setSelectedLead(null)}
          title={`Lead Dossier: ${selectedLead.name}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Email</span>
                <p className="font-semibold text-gray-900">{selectedLead.email}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Service</span>
                <p className="font-semibold text-gray-900">{selectedLead.service || "General"}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Company</span>
                <p className="font-semibold text-gray-900">{selectedLead.companyName || "Independent"}</p>
              </div>
              <div>
                <span className="text-gray-400 font-mono uppercase text-[10px]">Est. Value</span>
                <p className="font-semibold text-emerald-700 font-mono text-sm">${(Number(selectedLead.estimatedValue) || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-gray-700">Stage: <span className="uppercase text-[#806000]">{selectedLead.stage}</span></span>
              {selectedLead.stage !== "won" && (
                <button
                  type="button"
                  onClick={() => handleConvertToClient(selectedLead.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                >
                  <UserCheck size={14} />
                  <span>Convert to Corporate Client</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Lead Opportunity"
        >
          <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Lead Name *</label>
              <input
                type="text"
                required
                value={newLeadForm.name}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                placeholder="e.g. Michael Thorne"
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Focus</label>
                <input
                  type="text"
                  value={newLeadForm.service}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
                  placeholder="e.g. Cloud & DevOps"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newLeadForm.companyName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                  placeholder="Apex Global"
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Estimated Value ($)</label>
                <input
                  type="number"
                  value={newLeadForm.estimatedValue}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedValue: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:ring-1 focus:ring-[#f5c518]"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Service Required</label>
              <select
                value={newLeadForm.service}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
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
                Create Lead
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
