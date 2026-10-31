import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Plus,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api.js';
import { socket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.js';
import { SupportTicket, SupportMessage } from '../types/index.js';

export const SupportDesk: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [senderRole, setSenderRole] = useState<'agent' | 'customer'>('agent');

  const loadTickets = async () => {
    try {
      const data = await api.getSupportTickets();
      setTickets(data);
      if (!selectedTicket && data.length > 0) {
        loadTicketDetail(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTicketDetail = async (id: string) => {
    try {
      const data = await api.getTicketDetail(id);
      setSelectedTicket(data.ticket);
      setMessages(data.messages);
      socket.emit('room:join', `ticket_${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const handleNewMessage = (newMsg: SupportMessage) => {
      setMessages(prev => [...prev, newMsg]);
    };

    socket.on('support:new_message', handleNewMessage);
    return () => {
      socket.off('support:new_message');
    };
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const senderName = senderRole === 'agent' ? user?.name || 'On-Call Engineer' : selectedTicket.customer_name;
      await api.sendTicketMessage(selectedTicket.id, {
        sender_type: senderRole,
        sender_name: senderName,
        message: replyText.trim()
      });
      setReplyText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-200">
      {/* Tickets List */}
      <div className="w-full lg:w-80 shrink-0 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-white text-sm">Customer & Partner Queue</h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-dark-800 px-2 py-0.5 rounded-full border border-slate-700">
            {tickets.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tickets.map(tkt => {
            const isSelected = selectedTicket?.id === tkt.id;
            return (
              <div
                key={tkt.id}
                onClick={() => loadTicketDetail(tkt.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-600/15 border-cyan-500/50 shadow-md'
                    : 'bg-dark-900/40 border-slate-800 hover:bg-dark-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                      tkt.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    {tkt.priority}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    {tkt.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{tkt.subject}</h4>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[130px] font-medium">{tkt.customer_name}</span>
                  <span>{new Date(tkt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Details & Live Thread */}
      {selectedTicket ? (
        <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-800">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-dark-900/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                  {selectedTicket.id}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">• {selectedTicket.customer_email}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                ACTIVE CHAT
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-dark-950/40">
            {messages.map((m, idx) => {
              const isAgent = m.sender_type === 'agent';
              return (
                <div
                  key={m.id || idx}
                  className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-200">{m.sender_name}</span>
                    <span>• {new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                        : 'bg-dark-850 text-slate-200 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-dark-900/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Send as:</span>
              <button
                type="button"
                onClick={() => setSenderRole('agent')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  senderRole === 'agent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Engineer / Agent
              </button>
              <button
                type="button"
                onClick={() => setSenderRole('customer')}
                className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                  senderRole === 'customer' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Simulate Customer
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type real-time response..."
                className="flex-1 bg-dark-850 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 glass-panel rounded-2xl flex items-center justify-center border border-slate-800 text-slate-400 text-xs">
          Select a support ticket to view conversation
        </div>
      )}
    </div>
  );
};
