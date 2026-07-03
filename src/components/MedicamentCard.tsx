'use client';

import { Medicament } from '@/lib/data';
import { CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';

interface MedicamentCardProps {
  medicament: Medicament;
  onSelect?: () => void;
  isSelectable?: boolean;
}

export default function MedicamentCard({ medicament, onSelect, isSelectable = false }: MedicamentCardProps) {
  const isInStock = medicament.stock > 0;

  return (
    <div 
      onClick={isSelectable ? onSelect : undefined}
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all ${isSelectable ? 'cursor-pointer hover:border-blue-400' : ''}`}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-slate-50 flex items-center justify-center overflow-hidden">
        <img
          src={medicament.image}
          alt={medicament.nom}
          className="w-40 h-40 object-contain"
        />
        
        {/* Stock Badge */}
        <div className={`absolute top-3 right-3 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${
          isInStock 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {isInStock ? (
            <>
              <CheckCircle size={14} />
              En stock
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              Rupture
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
            {medicament.categorie.replace('-', ' ')}
          </p>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2">
            {medicament.nom}
          </h3>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Prix</p>
            <p className="text-lg font-bold text-blue-600">
              {medicament.prix.toLocaleString()} <span className="text-xs text-slate-500">FCFA</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Stock</p>
            <p className={`text-sm font-semibold ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
              {medicament.stock}
            </p>
          </div>
        </div>

        {isSelectable && (
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
            <ShoppingCart size={16} />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}
