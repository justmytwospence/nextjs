import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface HoverState {
  hoverIndex: number;
  setHoverIndex: (index: number) => void;
  hoveredGradient: number | null;
  setHoveredGradient: (gradient: number | null) => void;
}

export const useStore = create<HoverState>()(
  subscribeWithSelector((set) => ({
    hoverIndex: -1,
    setHoverIndex: (index) => set((state) => {
      if (state.hoverIndex === index) return state;
      return { hoverIndex: index };
    }),
    hoveredGradient: null,
    setHoveredGradient: (gradient) => set((state) => {
      if (state.hoveredGradient === gradient) return state;
      return { hoveredGradient: gradient };
    })
  }))
);
