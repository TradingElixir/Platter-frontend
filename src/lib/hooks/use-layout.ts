import { atom, useAtom } from 'jotai';
import { LAYOUT_OPTIONS } from '@/lib/constants';

// 1. set initial atom for platter layout
const platterLayoutAtom = atom(
  typeof window !== 'undefined'
    ? localStorage.getItem('platter-layout')
    : LAYOUT_OPTIONS.MODERN
);

const platterLayoutAtomWithPersistence = atom(
  (get) => get(platterLayoutAtom),
  (get, set, newStorage: any) => {
    set(platterLayoutAtom, newStorage);
    localStorage.setItem('platter-layout', newStorage);
  }
);

// 2. useLayout hook to check which layout is available
export function useLayout() {
  const [layout, setLayout] = useAtom(platterLayoutAtomWithPersistence);
  return {
    layout,
    setLayout,
  };
}
