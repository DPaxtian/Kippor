import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import { getLabels, getLabelsByOrderId, createLabel, updateLabel, deleteLabel } from '@/db/labels';
import type { CreateLabelInput, Label, UpdateLabelInput } from '@/types';

interface LabelsState {
  labels: Label[];
  orderLabelsMap: Record<number, Label[]>; // orderId → Label[]
  isLoading: boolean;
  fetchLabels: () => Promise<void>;
  fetchLabelsForOrders: (orderIds: number[]) => Promise<void>;
  createLabel: (input: CreateLabelInput) => Promise<number>;
  updateLabel: (id: number, input: UpdateLabelInput) => Promise<void>;
  deleteLabel: (id: number) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  orderLabelsMap: {},
  isLoading: false,

  fetchLabels: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      const labels = await getLabels(db);
      set({ labels });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLabelsForOrders: async (orderIds) => {
    if (orderIds.length === 0) return;
    const db = await getDatabase();
    const entries = await Promise.all(
      orderIds.map(async (id) => [id, await getLabelsByOrderId(db, id)] as [number, Label[]])
    );
    const map: Record<number, Label[]> = {};
    entries.forEach(([id, labels]) => { map[id] = labels; });
    set({ orderLabelsMap: map });
  },

  createLabel: async (input) => {
    const db = await getDatabase();
    const id = await createLabel(db, input);
    const labels = await getLabels(db);
    set({ labels });
    return id;
  },

  updateLabel: async (id, input) => {
    const db = await getDatabase();
    await updateLabel(db, id, input);
    const labels = await getLabels(db);
    set({ labels });
  },

  deleteLabel: async (id) => {
    const db = await getDatabase();
    await deleteLabel(db, id);
    set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }));
  },
}));
