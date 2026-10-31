import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Plus, 
  Search,
  Activity,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';
import { Incident, IncidentUpdate, Task } from '../types/index.js';

interface IncidentWarRoomProps {
  initialIncidentId?: string;
}

export const IncidentWarRoom: React.FC<IncidentWarRoomProps> = ({ initialIncidentId }) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageType, setMessageType] = useState<'comment' | 'action_item' | 'status_change'>('comment');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('P1');
  const [newServiceId, setNewServiceId] = useState('srv_payments');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load incidents
  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents({ severity: filterSeverity === 'all' ? undefined : filterSeverity });
      setIncidents(data);
      if (!selectedIncident && data.length > 0) {
        const target = initialIncidentId ? data.find((i: Incident) => i.id === initialIncidentId) || data[0] : data[0];
        loadIncidentDetail(target.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadIncidentDetail = async (id: string) => {
    try {
      const data = await api.getIncidentDetail(id);
      setSelectedIncident(data.incident);
      setUpdates(data.updates);
      setLinkedTasks(data.linkedTasks);

      // Join socket room for this specific incident war room
      socket.emit('room:join', `incident_${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [filterSeverity]);

  useEffect(() => {
    if (initialIncidentId) {
      loadIncidentDetail(initialIncidentId);
    }
  }, [initialIncidentId]);

  // Real-time socket message reception
  useEffect(() => {
    const handleNewMessage = (newUpdate: IncidentUpdate) => {
      setUpdates(prev => [...prev, newUpdate]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleStatusUpdate = () => {
      if (selectedIncident) {
        loadIncidentDetail(selectedIncident.id);
        loadIncidents();
      }
    };

    socket.on('incident:message', handleNewMessage);
    socket.on('incident:general_update', handleStatusUpdate);

    return () => {
      socket.off('incident:message', handleNewMessage);
      socket.off('incident:general_update', handleStatusUpdate);
    };
  }, [selectedIncident]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedIncident) return;

    try {
      await api.postIncidentUpdate(selectedIncident.id, {
        user_id: user?.id,
        author_name: user?.name || 'On-Call Engineer',
        message: messageInput.trim(),
        update_type: messageType
      });
      setMessageInput('');
      setMessageType('comment');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!selectedIncident) return;
    try {
      await api.updateIncidentStatus(selectedIncident.id, nextStatus, user?.id, user?.name);
      loadIncidentDetail(selectedIncident.id);
      loadIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclareIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const created = await api.createIncident({
        title: newTitle,
        description: newDesc,
        severity: newSeverity,
        service_id: newServiceId,
        lead_id: user?.id
      });
      setIsDeclareOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadIncidents();
      loadIncidentDetail(created.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-200">
      {/* Left Column: Incidents Triage List */}
      <div className="w-full lg:w-80 shrink-0 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="font-bold text-white text-sm">Incident Roster</h2>
          </div>
          <button
            onClick={() => setIsDeclareOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Declare
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-slate-800 flex gap-1">
          {['all', 'P1', 'P2', 'P3'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                filterSeverity === sev
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Incident List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {incidents.map(inc => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => loadIncidentDetail(inc.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md'
                    : 'bg-dark-900/40 border-slate-800 hover:bg-dark-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                      inc.severity === 'P1'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    {inc.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{inc.title}</h4>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[130px]">{inc.service_name}</span>
                  <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active War Room */}
      {selectedIncident ? (
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800">
          {/* War Room Header */}
          <div className="p-5 border-b border-slate-800 bg-dark-900/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${
                    selectedIncident.severity === 'P1'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {selectedIncident.severity}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedIncident.description}</p>
                </div>
              </div>

              {/* SLA & Commander info */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Incident Commander</div>
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                    <img
                      src={selectedIncident.lead_avatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'}
                      alt="Lead"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{selectedIncident.lead_name || 'Sarah Chen'}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider">SLA Target</div>
                    <div className="text-xs font-mono font-bold">ACTIVE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Progression Stepper */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['triggered', 'investigating', 'mitigated', 'resolved'].map((st, idx) => {
                  const isCurrent = selectedIncident.status === st;
                  const isPast =
                    ['triggered', 'investigating', 'mitigated', 'resolved'].indexOf(selectedIncident.status) >= idx;

                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                          : isPast
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-dark-900 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Service: <strong className="text-slate-200">{selectedIncident.service_name}</strong>
              </span>
            </div>
          </div>

          {/* War Room Live Chat / Audit Timeline */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-dark-950/40">
            {updates.map((upd, idx) => {
              const isAction = upd.update_type === 'action_item';
              const isStatus = upd.update_type === 'status_change';

              return (
                <div
                  key={upd.id || idx}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isAction
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : isStatus
                      ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                      : 'bg-dark-900/60 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={upd.author_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={upd.author_name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-bold text-white">{upd.author_name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-dark-800 text-slate-400">
                        {upd.update_type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(upd.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-slate-300">{upd.message}</p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* War Room Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-dark-900/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Type:</span>
              <button
                type="button"
                onClick={() => setMessageType('comment')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  messageType === 'comment' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Comment
              </button>
              <button
                type="button"
                onClick={() => setMessageType('action_item')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  messageType === 'action_item' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Action Item
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Post live update, mitigation step, or command output to War Room..."
                className="flex-1 bg-dark-850 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center border border-slate-800 text-slate-400 text-xs">
          Select an incident to open the War Room
        </div>
      )}

      {/* Declare Incident Modal */}
      {isDeclareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Declare Production Incident</h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly notifies on-call team and opens live collaborative war room.
            </p>

            <form onSubmit={handleDeclareIncident} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ingress Gateway SSL handshake timeouts"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Impact Description</label>
                <textarea
                  rows={2}
                  placeholder="Detail customer impact or observed error signatures..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value)}
                    className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="P1">P1 - Critical (SLA: 30m)</option>
                    <option value="P2">P2 - Major (SLA: 2h)</option>
                    <option value="P3">P3 - Minor (SLA: 8h)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Impacted Service</label>
                  <select
                    value={newServiceId}
                    onChange={e => setNewServiceId(e.target.value)}
                    className="w-full bg-dark-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="srv_payments">Payment Processing Gateway</option>
                    <option value="srv_auth">Auth0 Identity Provider</option>
                    <option value="srv_db">PostgreSQL Cluster</option>
                    <option value="srv_ws">WebSocket Ingress</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeclareOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Declare Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
