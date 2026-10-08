import { create } from 'zustand';

interface PromoBannerState {
  bannerHeight: number;
  isBannerVisible: boolean;
  setBannerHeight: (height: number) => void;
  setIsBannerVisible: (visible: boolean) => void;
}

export const usePromoBannerStore = create<PromoBannerState>((set) => ({
  bannerHeight: 0,
  isBannerVisible: false,
  setBannerHeight: (height: number) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--promo-banner-height', `${height}px`);
    }
    set({ bannerHeight: height });
  },
  setIsBannerVisible: (visible: boolean) => {
    if (!visible && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--promo-banner-height', '0px');
    }
    set((state) => ({
      isBannerVisible: visible,
      bannerHeight: visible ? state.bannerHeight : 0,
    }));
  },
}));
