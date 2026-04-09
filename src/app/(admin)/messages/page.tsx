'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/messages?filter=${filter}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (msg: Message) => {
    if (!msg.is_read) {
      await fetch(`/api/admin/messages/${msg.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
    }
    setSelected({ ...msg, is_read: true });
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
  };

  const archive = async (id: string) => {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: true }),
    });
    setSelected(null);
    fetchMessages();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/messages/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    setSelected(null);
    fetchMessages();
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Messages</h1>
          <p className="text-[13px] text-[#999]">Contact form submissions</p>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left — Message List */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#E5E4E2] bg-white">
          <div className="flex gap-2 border-b border-[#E5E4E2] p-4">
            {['all', 'unread', 'archived'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  filter === f ? 'bg-[#1A1A1A] text-white' : 'bg-[#F0EFED] text-[#999]'
                }`}>
                {f === 'all' ? `All (${messages.length})` : f === 'unread' ? `Unread (${unreadCount})` : 'Archived'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="py-12 text-center text-[13px] text-[#999]">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[#999]">No messages</div>
            ) : (
              messages.map(msg => (
                <button key={msg.id} onClick={() => markRead(msg)}
                  className={`flex w-full flex-col gap-1 border-b border-[#E5E4E2] p-4 text-left transition-colors ${
                    selected?.id === msg.id ? 'border-l-[3px] border-l-[#1A1A1A] bg-[#F0EFED]' : msg.is_read ? '' : 'border-l-[3px] border-l-[#C0392B]'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] ${msg.is_read ? 'text-[#6B6B6B]' : 'font-bold text-[#1A1A1A]'}`}>{msg.name}</span>
                    <span className="text-[10px] text-[#999]">{timeAgo(msg.created_at)}</span>
                  </div>
                  {msg.project_type && <span className="text-[11px] text-[#2471A3]">{msg.project_type}</span>}
                  <span className="line-clamp-1 text-[11px] text-[#6B6B6B]">{msg.message}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Detail */}
        <Card className="flex-1 overflow-auto">
          <CardContent className="p-6">
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20">
                <span className="text-[13px] text-[#999]">Select a message to view</span>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">{selected.name}</h2>
                    <span className="text-[13px] text-[#6B6B6B]">{timeAgo(selected.created_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => archive(selected.id)}>Archive</Button>
                    <Button variant="outline" size="sm" className="text-[#C0392B] border-[#C0392B]/30" onClick={() => setDeleteId(selected.id)}>Delete</Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-[#E5E4E2] p-3">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#999]">Email</span>
                    <p className="mt-1 text-[13px] text-[#1A1A1A]">{selected.email}</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E4E2] p-3">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#999]">Phone</span>
                    <p className="mt-1 text-[13px] text-[#1A1A1A]">{selected.phone || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E4E2] p-3">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#999]">Project Type</span>
                    <p className="mt-1 text-[13px] text-[#2471A3]">{selected.project_type || '—'}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5E4E2] p-5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[#999]">Message</span>
                  <p className="mt-2 text-[14px] leading-[1.8] text-[#1A1A1A]">{selected.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Message</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
