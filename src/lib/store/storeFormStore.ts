import { create } from "zustand";
import { StoreFormData } from "@/lib/utils/schemas/storeCreate/storeSchema";

interface StoreFormState {
  data: Partial<StoreFormData>;
  setData: (newData: Partial<StoreFormData>) => void;
  reset: () => void;
}

export const useStoreFormStore = create<StoreFormState>((set) => ({
  data: {},
  setData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  reset: () => set({ data: {} }),
}));
