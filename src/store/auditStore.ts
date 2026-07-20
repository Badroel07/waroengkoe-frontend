import { create } from 'zustand';
import type { StockAudit, AuditItem } from '@/types';
import { generateId } from '@/lib/utils';

interface AuditState {
  audits: StockAudit[];
  createAudit: (userId: string, userName: string, items: AuditItem[]) => StockAudit;
  getAudit: (id: string) => StockAudit | undefined;
  updateItem: (auditId: string, itemId: string, data: Partial<AuditItem>) => void;
  completeAudit: (auditId: string) => void;
  deleteAudit: (id: string) => void;
}

const STORAGE_KEY = 'waroengkoe_audits';

function load(): StockAudit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data: StockAudit[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export const useAuditStore = create<AuditState>((set, get) => ({
  audits: load(),

  createAudit: (userId, userName, items) => {
    const audit: StockAudit = {
      id: generateId(),
      created_at: new Date().toISOString(),
      user_id: userId,
      user_name: userName,
      status: 'draft',
      items,
      total_items: items.length,
      completed_items: 0,
    };
    set((s) => { const next = [audit, ...s.audits]; save(next); return { audits: next }; });
    return audit;
  },

  getAudit: (id) => get().audits.find((a) => a.id === id),

  updateItem: (auditId, itemId, data) => {
    set((s) => {
      const next = s.audits.map((a) => {
        if (a.id !== auditId) return a;
        const items = a.items.map((i) => i.id === itemId ? { ...i, ...data } : i);
        const completedItems = items.filter((i) => i.stok_fisik !== undefined && i.stok_fisik !== null).length;
        return { ...a, items, completed_items: completedItems };
      });
      save(next);
      return { audits: next };
    });
  },

  completeAudit: (auditId) => {
    set((s) => {
      const next = s.audits.map((a) => a.id === auditId ? { ...a, status: 'selesai' as const } : a);
      save(next);
      return { audits: next };
    });
  },

  deleteAudit: (id) => {
    set((s) => { const next = s.audits.filter((a) => a.id !== id); save(next); return { audits: next }; });
  },
}));
