import { create } from 'zustand';
import type { CartItemType, CartTotalsType, ProductUnit } from '@/types';
import { generateId } from '@/lib/utils';
import { useProductStore } from './productStore';

interface ExtendedCartItemType extends CartItemType {
  satuans: ProductUnit[];
  gambar_url: string | null;
}

interface CartState {
  items: ExtendedCartItemType[];
  diskonGlobal: number;
  metodePembayaran: 'Tunai' | 'QRIS';
  heldCarts: { id: string; name: string; items: ExtendedCartItemType[] }[];

  addItem: (product: { id: string; nama: string; satuan: ProductUnit }, qty?: number) => void;
  updateQty: (cartKey: string, qty: number) => void;
  updateCartItemQty: (cartKey: string, qty: string) => void;
  updateHarga: (cartKey: string, harga: number) => void;
  updateSatuan: (cartKey: string, satuanId: string) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
  setDiskonGlobal: (diskon: number) => void;
  setMetodePembayaran: (metode: 'Tunai' | 'QRIS') => void;
  getTotals: () => CartTotalsType;
  holdCart: (name: string) => void;
  restoreCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  diskonGlobal: 0,
  metodePembayaran: 'Tunai',
  heldCarts: [],

  addItem: (product, qty = 1) => {
    const products = useProductStore.getState().products;
    const fullProduct = products.find((p) => p.id === product.id);
    const productUnits = fullProduct ? fullProduct.satuans : [product.satuan];
    const gambar_url = fullProduct ? fullProduct.gambar_url : null;

    set((s) => {
      const existing = s.items.find(
        (i) => i.id === product.id && i.satuan_id === product.satuan.id,
      );
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.cartKey === existing.cartKey
              ? { ...i, qty: i.qty + qty, subtotal: (i.qty + qty) * i.harga }
              : i,
          ),
        };
      }
      const newItem: ExtendedCartItemType = {
        cartKey: generateId(),
        id: product.id,
        nama: product.nama,
        qty: qty,
        satuan_id: product.satuan.id,
        satuan_nama: product.satuan.nama,
        harga: product.satuan.harga_jual,
        subtotal: product.satuan.harga_jual * qty,
        satuans: productUnits,
        gambar_url,
      };
      return { items: [...s.items, newItem] };
    });
  },

  updateQty: (cartKey, qty) => {
    if (qty <= 0) {
      set((s) => ({ items: s.items.filter((i) => i.cartKey !== cartKey) }));
      return;
    }
    set((s) => ({
      items: s.items.map((i) =>
        i.cartKey === cartKey ? { ...i, qty, subtotal: qty * i.harga } : i,
      ),
    }));
  },

  updateCartItemQty: (cartKey, qty) => {
    const parsedQty = parseInt(qty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) return;
    set((s) => ({
      items: s.items.map((i) =>
        i.cartKey === cartKey ? { ...i, qty: parsedQty, subtotal: parsedQty * i.harga } : i,
      ),
    }));
  },

  updateHarga: (cartKey, harga) => {
    if (harga < 0) return;
    set((s) => ({
      items: s.items.map((i) =>
        i.cartKey === cartKey ? { ...i, harga, subtotal: i.qty * harga } : i,
      ),
    }));
  },

  updateSatuan: (cartKey, satuanId) => {
    set((s) => ({
      items: s.items.map((i) => {
        if (i.cartKey !== cartKey) return i;
        const matchingUnit = i.satuans.find((u) => u.id === satuanId);
        if (!matchingUnit) return i;
        return {
          ...i,
          satuan_id: matchingUnit.id,
          satuan_nama: matchingUnit.nama,
          harga: matchingUnit.harga_jual,
          subtotal: i.qty * matchingUnit.harga_jual,
        };
      }),
    }));
  },

  removeItem: (cartKey) => {
    set((s) => ({ items: s.items.filter((i) => i.cartKey !== cartKey) }));
  },

  clearCart: () => set({ items: [], diskonGlobal: 0 }),

  setDiskonGlobal: (diskon) => set({ diskonGlobal: Math.max(0, diskon) }),

  setMetodePembayaran: (metode) => set({ metodePembayaran: metode }),

  getTotals: () => {
    const { items, diskonGlobal } = get();
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const diskonItem = items.reduce((sum, i) => {
      const originalPrice = i.satuans.find((u) => u.id === i.satuan_id)?.harga_jual || i.harga;
      return sum + (originalPrice * i.qty - i.subtotal);
    }, 0);
    const total = Math.max(0, subtotal - diskonGlobal);
    return { subtotal, diskonItem, diskonGlobal, total, bayar: 0, kembalian: 0 };
  },

  holdCart: (name) => {
    const { items } = get();
    if (items.length === 0) return;
    const held = { id: generateId(), name, items: [...items] };
    set((s) => ({ heldCarts: [...s.heldCarts, held], items: [], diskonGlobal: 0 }));
  },

  restoreCart: (id) => {
    const { heldCarts } = get();
    const held = heldCarts.find((h) => h.id === id);
    if (!held) return;
    set((s) => ({
      items: [...held.items],
      heldCarts: s.heldCarts.filter((h) => h.id !== id),
    }));
  },

  deleteHeldCart: (id) => {
    set((s) => ({ heldCarts: s.heldCarts.filter((h) => h.id !== id) }));
  },
}));
