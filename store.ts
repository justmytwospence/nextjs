import type { Aspect } from "pathfinder";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface HoverIndexState {
  hoverIndex: number;
  setHoverIndex: (index: number) => void;
}

interface GradientState {
  hoveredGradient: number | null;
  setHoveredGradient: (gradient: number | null) => void;
}

interface AspectState {
  hoveredAspect: Aspect | null;
  setHoveredAspect: (aspect: Aspect | null) => void;
}

export type HoverIndexStore = UseBoundStore<StoreApi<HoverIndexState>>;
export type GradientStore = UseBoundStore<StoreApi<GradientState>>;

export const createHoverIndexStore = () => create<HoverIndexState>()(
  subscribeWithSelector((set) => ({
    hoverIndex: -1,
    setHoverIndex: (index) => set((state) => {
      if (state.hoverIndex === index) return state;
      return { hoverIndex: index };
    }),
  }))
);
export const hoverIndexStore = createHoverIndexStore();

export const createGradientStore = () => create<GradientState>()(
  subscribeWithSelector((set) => ({
    hoveredGradient: null,
    setHoveredGradient: (gradient) => set((state) => {
      if (state.hoveredGradient === gradient) return state;
      return { hoveredGradient: gradient };
    }),
  }))
);
export const gradientStore = createGradientStore();

export const createAspectStore = () => create<AspectState>()(
  subscribeWithSelector((set) => ({
    hoveredAspect: null,
    setHoveredAspect: (aspect) => set((state) => {
      if (state.hoveredAspect === aspect) return state;
      return { hoveredAspect: aspect };
    }),
  }))
);
export const aspectStore = createAspectStore();