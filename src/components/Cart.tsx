"use client";

import { FiTrash2, FiShoppingCart, FiTag, FiMinus } from "react-icons/fi";

export interface CartItem {
  key: string;
  produto_id: number;
  produto_descricao: string;
  tipo: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  teve_promocao: boolean;
}

interface CartProps {
  itens: CartItem[];
  onRemove: (key: string) => void;
  onDecrease: (key: string) => void;
  total: number;
}

export default function Cart({ itens, onRemove, onDecrease, total }: CartProps) {
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <FiShoppingCart className="text-gray-300" size={28} />
        </div>
        <p className="text-gray-400 font-medium text-sm">Carrinho vazio</p>
        <p className="text-gray-300 text-xs mt-1">Selecione produtos à esquerda</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {itens.map((item) => (
        <div
          key={item.key}
          className="group flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50/50 transition-colors border border-transparent hover:border-red-100"
        >
          {/* Qty badge */}
          <div className="shrink-0 w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center">
            <span className="text-brand-red font-bold text-sm">
              {item.tipo === "KG"
                ? `${item.quantidade.toFixed(3)}k`
                : `${item.quantidade}x`}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-dark leading-tight truncate">
              {item.produto_descricao}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                R$ {item.valor_unitario.toFixed(2).replace(".", ",")}
                {item.tipo === "KG" ? "/kg" : "/un"}
              </span>
              {item.teve_promocao && (
                <span className="tag-promo text-[10px]">
                  <FiTag size={8} /> Promo
                </span>
              )}
            </div>
          </div>

          {/* Total + actions */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="font-bold text-sm text-brand-dark">
              R$ {item.valor_total.toFixed(2).replace(".", ",")}
            </span>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
              {/* Decrease by 1 button — only for UN items with qty > 1 */}
              {item.tipo !== "KG" && item.quantidade > 1 && (
                <button
                  onClick={() => onDecrease(item.key)}
                  id={`decrease-item-${item.key}`}
                  className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:text-amber-700 flex items-center justify-center transition-all"
                  aria-label="Diminuir 1 unidade"
                  title="Diminuir 1 unidade"
                >
                  <FiMinus size={12} />
                </button>
              )}
              {/* Remove all button */}
              <button
                onClick={() => onRemove(item.key)}
                id={`remove-item-${item.key}`}
                className="text-red-400 hover:text-red-600 transition-all"
                aria-label="Remover item"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">Total</span>
        <span className="text-2xl font-extrabold text-brand-red">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>
    </div>
  );
}
