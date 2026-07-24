"use client";

import { useState } from "react";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";

interface Produto {
  id: number;
  descricao: string;
  valor: string | number;
  tipo: string;
}

interface QuantityModalProps {
  produto: Produto | null;
  onConfirm: (quantidade: number) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function QuantityModal({
  produto,
  onConfirm,
  onClose,
  loading,
}: QuantityModalProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [pesoInput, setPesoInput] = useState("0.500");

  if (!produto) return null;

  const isKg = produto.tipo === "KG";

  const handleConfirm = () => {
    const qty = isKg ? Number(parseFloat(pesoInput).toFixed(3)) : quantidade;
    if (qty <= 0) return;
    onConfirm(qty);
  };

  const adjustQty = (delta: number) => {
    setQuantidade((prev) => Math.max(1, prev + delta));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-red/10 to-brand-orange/10 rounded-xl flex items-center justify-center">
              <GiIceCreamCone className="text-brand-red" size={22} />
            </div>
            <div>
              <h2 className="font-bold text-brand-dark text-base leading-tight">
                {produto.descricao}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                R$ {Number(produto.valor).toFixed(2).replace(".", ",")}
                {isKg ? " / kg" : " / unidade"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            id="modal-close-btn"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Quantity input */}
        <div className="mb-6">
          <label className="label">
            {isKg ? "Peso (kg)" : "Quantidade"}
          </label>

          {isKg ? (
            <input
              id="input-peso"
              type="number"
              step="0.001"
              min="0.001"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              className="input text-center text-2xl font-bold"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-4">
              <button
                id="qty-minus"
                onClick={() => adjustQty(-1)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                disabled={quantidade <= 1}
              >
                <FiMinus size={18} className={quantidade <= 1 ? "text-gray-300" : "text-gray-600"} />
              </button>
              <input
                id="input-quantidade"
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="input text-center text-2xl font-bold flex-1"
              />
              <button
                id="qty-plus"
                onClick={() => adjustQty(1)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <FiPlus size={18} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1" id="modal-cancel-btn">
            Cancelar
          </button>
          <button
            id="modal-confirm-btn"
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? "Calculando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
