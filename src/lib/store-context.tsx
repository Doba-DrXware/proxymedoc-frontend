'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { pharmacies as initialPharmacies, Pharmacie, Medicament } from './data';

interface CartItem {
  pharmacieId: number;
  pharmacieName: string;
  medicament: Medicament;
  quantity: number;
}

interface StoreContextType {
  pharmacies: Pharmacie[];
  cart: CartItem[];
  updateCatalogue: (pharmacieId: number, meds: Medicament[]) => void;
  updateGarde: (pharmacieId: number, garde: boolean) => void;
  updatePharmacie: (pharmacieId: number, patch: Partial<Pharmacie>) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
}

const StoreContext = createContext<StoreContextType>({
  pharmacies: initialPharmacies,
  cart: [],
  updateCatalogue: () => {},
  updateGarde: () => {},
  updatePharmacie: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>(initialPharmacies);
  const [cart, setCart] = useState<CartItem[]>([]);

  const updateCatalogue = (pharmacieId: number, meds: Medicament[]) => {
    setPharmacies(prev =>
      prev.map(p => p.id === pharmacieId ? { ...p, meds } : p)
    );
  };

  const updateGarde = (pharmacieId: number, garde: boolean) => {
    setPharmacies(prev =>
      prev.map(p => p.id === pharmacieId ? { ...p, garde } : p)
    );
  };

  const updatePharmacie = (pharmacieId: number, patch: Partial<Pharmacie>) => {
    setPharmacies(prev => prev.map(p => p.id === pharmacieId ? { ...p, ...patch } : p));
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        cartItem => cartItem.pharmacieId === item.pharmacieId && cartItem.medicament.nom === item.medicament.nom
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const nextQuantity = Math.min(existing.quantity + item.quantity, item.medicament.stock);
        updated[existingIndex] = { ...existing, quantity: nextQuantity };
        return updated;
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <StoreContext.Provider value={{ pharmacies, cart, updateCatalogue, updateGarde, updatePharmacie, addToCart, removeFromCart }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
