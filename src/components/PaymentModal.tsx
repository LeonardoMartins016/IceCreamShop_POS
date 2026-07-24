"use client";

import { useState } from "react";
import { FiX, FiDollarSign, FiCreditCard } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { CartItem } from "./Cart";

interface Comanda {
  id: number;
  numero: number;
}

interface PaymentModalProps {
  total: number;
  itens: CartItem[];
  comandas: Comanda[];
  onConfirm: (data: {
    metodo_pagamento: string;
    tipo: "Direta" | "Comanda";
    comanda_id?: number | "nova";
  }) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function PaymentModal({
  total,
  itens,
  comandas,
  onConfirm,
  onClose,
  loading,
}: PaymentModalProps) {
  const [metodo, setMetodo] = useState<string>("Dinheiro");
  const [tipoVenda, setTipoVenda] = useState<"Direta" | "Comanda">("Direta");
  const [selectedComanda, setSelectedComanda] = useState<number | "nova" | "">("");
  const [valorRecebido, setValorRecebido] = useState<string>("");

  const handleConfirm = () => {
    if (tipoVenda === "Comanda" && !selectedComanda) return;
    onConfirm({
      metodo_pagamento: metodo,
      tipo: tipoVenda,
      comanda_id: tipoVenda === "Comanda" ? (selectedComanda as number | "nova") : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-brand-dark">Finalizar Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" id="payment-close-btn">
            <FiX size={20} />
          </button>
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resumo ({itens.length} {itens.length === 1 ? "item" : "itens"})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto mb-3">
            {itens.map((item) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate mr-2">
                  {item.quantidade}x {item.produto_descricao}
                </span>
                <span className="font-medium shrink-0">
                  R$ {item.valor_total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-extrabold text-brand-red">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-5">
          <label className="label">Forma de Pagamento</label>
          <div className="grid grid-cols-2 gap-3">
            {(["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"]).map((m) => (
              <button
                key={m}
                id={`payment-${m.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMetodo(m)}
                className={`
                  flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm
                  transition-all duration-150
                  ${metodo === m
                    ? "border-brand-red bg-brand-red text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                {m === "Dinheiro" ? <FiDollarSign size={18} /> : 
                 m === "PIX" ? <BsQrCode size={18} /> : 
                 <FiCreditCard size={18} />}
                {m}
                <div
                  className={`w-4 h-4 ml-auto rounded-full border-2 flex items-center justify-center shrink-0
                    ${metodo === m ? "border-white" : "border-gray-300"}
                  `}
                >
                  {metodo === m && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {metodo === "Dinheiro" && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="label text-gray-700">Valor Recebido (R$)</label>
              <input
                type="number"
                step="0.01"
                min={total}
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                className="input"
                placeholder="Ex: 50.00"
              />
              {Number(valorRecebido) > 0 && Number(valorRecebido) >= total && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Troco a devolver:</span>
                  <span className="text-lg font-extrabold text-green-600">
                    R$ {(Number(valorRecebido) - total).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sale type */}
        <div className="mb-5">
          <label className="label">Tipo de Venda</label>
          <div className="grid grid-cols-2 gap-3">
            {(["Direta", "Comanda"] as const).map((t) => (
              <button
                key={t}
                id={`tipo-${t.toLowerCase()}`}
                onClick={() => setTipoVenda(t)}
                className={`
                  py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150
                  ${tipoVenda === t
                    ? "border-brand-blue bg-brand-blue text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Comanda selection */}
        {tipoVenda === "Comanda" && (
          <div className="mb-5">
            <label className="label" htmlFor="select-comanda">Vincular à Comanda</label>
            {comandas.length === 0 ? (
              <button
                onClick={() => setSelectedComanda("nova")}
                className={`w-full py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-150 ${
                  selectedComanda === "nova" ? "border-brand-blue bg-brand-blue text-white shadow-sm" : "border-brand-blue text-brand-blue bg-blue-50"
                }`}
              >
                + CRIAR NOVA COMANDA
              </button>
            ) : (
              <select
                id="select-comanda"
                value={selectedComanda}
                onChange={(e) => setSelectedComanda(e.target.value === "nova" ? "nova" : Number(e.target.value))}
                className="select"
              >
                <option value="">Selecione ou crie uma comanda...</option>
                <option value="nova" className="font-bold text-brand-blue">+ CRIAR NOVA COMANDA</option>
                {comandas.map((c) => (
                  <option key={c.id} value={c.id}>
                    Comanda #{c.numero}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1" id="payment-cancel-btn">
            Cancelar
          </button>
          <button
            id="payment-confirm-btn"
            onClick={handleConfirm}
            disabled={loading || (tipoVenda === "Comanda" && !selectedComanda)}
            className="btn-primary flex-1"
          >
            {loading ? "Salvando..." : "Confirmar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
