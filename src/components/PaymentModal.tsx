"use client";

import { useState } from "react";
import { FiX, FiDollarSign, FiCreditCard, FiCheckCircle, FiAlertCircle, FiUser } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { CartItem } from "./Cart";

interface Comanda {
  id: number;
  numero: number;
  nome?: string | null;
}

interface PaymentModalProps {
  total: number;
  itens: CartItem[];
  comandas: Comanda[];
  onConfirm: (data: {
    metodo_pagamento: string;
    tipo: "Direta" | "Comanda";
    comanda_id?: number | "nova";
    nome_comanda?: string;
  }) => void;
  onClose: () => void;
  loading?: boolean;
}

const METODOS = [
  { key: "Dinheiro", icon: FiDollarSign, color: "emerald" },
  { key: "PIX", icon: BsQrCode, color: "violet" },
  { key: "Cartão de Crédito", icon: FiCreditCard, color: "blue" },
  { key: "Cartão de Débito", icon: FiCreditCard, color: "amber" },
] as const;

export default function PaymentModal({
  total,
  itens,
  comandas,
  onConfirm,
  onClose,
  loading,
}: PaymentModalProps) {
  const [metodo, setMetodo] = useState<string>("Dinheiro");
  const [tipoVenda, setTipoVenda] = useState<"Direta" | "Comanda" | "">("");
  const [selectedComanda, setSelectedComanda] = useState<number | "nova" | "">("");
  const [nomeComanda, setNomeComanda] = useState<string>("");
  const [valorRecebido, setValorRecebido] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const valorRecebidoNum = Number(valorRecebido);
  const dinheiroValido =
    tipoVenda !== "Direta" ||
    metodo !== "Dinheiro" ||
    (valorRecebidoNum > 0 && valorRecebidoNum >= total);
  const comandaValida = tipoVenda !== "Comanda" || !!selectedComanda;
  const tipoSelecionado = tipoVenda !== "";
  const canConfirm = tipoSelecionado && dinheiroValido && comandaValida && !loading;

  const troco =
    tipoVenda === "Direta" &&
    metodo === "Dinheiro" &&
    valorRecebidoNum > 0 &&
    valorRecebidoNum >= total
      ? valorRecebidoNum - total
      : 0;

  const handleConfirmClick = () => {
    if (!canConfirm) return;
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    onConfirm({
      metodo_pagamento: tipoVenda === "Comanda" ? "Comanda" : metodo,
      tipo: tipoVenda as "Direta" | "Comanda",
      comanda_id:
        tipoVenda === "Comanda"
          ? (selectedComanda as number | "nova")
          : undefined,
      nome_comanda: tipoVenda === "Comanda" && selectedComanda === "nova" ? nomeComanda : undefined,
    });
  };

  const getMetodoStyle = (m: string, color: string) => {
    const isActive = metodo === m;
    const colorMap: Record<string, { active: string; ring: string; iconBg: string; iconText: string }> = {
      emerald: {
        active: "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/60 shadow-emerald-100",
        ring: "ring-emerald-500/20",
        iconBg: "bg-emerald-500",
        iconText: "text-emerald-700",
      },
      violet: {
        active: "border-violet-500 bg-gradient-to-br from-violet-50 to-violet-100/60 shadow-violet-100",
        ring: "ring-violet-500/20",
        iconBg: "bg-violet-500",
        iconText: "text-violet-700",
      },
      blue: {
        active: "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/60 shadow-blue-100",
        ring: "ring-blue-500/20",
        iconBg: "bg-blue-500",
        iconText: "text-blue-700",
      },
      amber: {
        active: "border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/60 shadow-amber-100",
        ring: "ring-amber-500/20",
        iconBg: "bg-amber-500",
        iconText: "text-amber-700",
      },
    };
    const c = colorMap[color];
    return {
      button: isActive
        ? `${c.active} border-2 shadow-md ring-4 ${c.ring}`
        : "border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
      iconContainer: isActive ? `${c.iconBg} text-white` : "bg-gray-100 text-gray-500",
      label: isActive ? `font-bold ${c.iconText}` : "font-medium text-gray-600",
    };
  };

  // ─── Confirmation Dialog ───────────────────────────────────────────────
  if (showConfirmDialog) {
    return (
      <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "modalIn 0.18s ease-out" }}
        >
          {/* Icon Header */}
          <div className="relative bg-gradient-to-br from-brand-red/10 via-brand-red/5 to-transparent pt-8 pb-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-red to-rose-600 flex items-center justify-center shadow-lg shadow-brand-red/25 mb-4">
              <FiAlertCircle className="text-white" size={30} />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Confirmar Venda?</h3>
            <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
          </div>

          {/* Sale Details */}
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Itens</span>
                <span className="font-semibold text-brand-dark">
                  {itens.length} {itens.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-semibold text-brand-dark">{tipoVenda}</span>
              </div>
              {tipoVenda === "Direta" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="font-semibold text-brand-dark">{metodo}</span>
                </div>
              )}
              {tipoVenda === "Comanda" && selectedComanda === "nova" && nomeComanda && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nome da comanda</span>
                  <span className="font-semibold text-brand-dark">{nomeComanda}</span>
                </div>
              )}
              {troco > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Troco</span>
                  <span className="font-bold text-emerald-600">
                    R$ {troco.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-700">Total</span>
                <span className="text-xl font-extrabold text-brand-red">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="btn-ghost flex-1 py-3.5"
              id="confirm-dialog-cancel-btn"
            >
              Voltar
            </button>
            <button
              id="confirm-dialog-confirm-btn"
              onClick={handleFinalConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm
                         bg-gradient-to-r from-brand-red to-rose-600
                         hover:from-brand-red hover:to-rose-700
                         active:scale-[0.97] transition-all duration-150
                         shadow-lg shadow-brand-red/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Payment Modal ────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.18s ease-out" }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-brand-red via-rose-500 to-brand-red px-6 py-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-60" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Finalizar Venda</h2>
              <p className="text-rose-100 text-xs mt-0.5">
                {itens.length} {itens.length === 1 ? "item" : "itens"} no carrinho
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
              id="payment-close-btn"
            >
              <FiX size={16} />
            </button>
          </div>
          {/* Total badge */}
          <div className="absolute -bottom-5 left-6 right-6">
            <div className="bg-white rounded-2xl shadow-lg shadow-black/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">Total a pagar</span>
              <span className="text-2xl font-extrabold text-brand-red tracking-tight">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-10 pb-6 max-h-[65vh] overflow-y-auto">
          {/* Order summary */}
          <details className="group mb-6">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors">
              <span>Resumo do pedido</span>
              <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {itens.map((item) => (
                <div key={item.key} className="flex justify-between text-sm py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-600 truncate mr-3">
                    <span className="font-semibold text-brand-dark">{item.quantidade}x</span>{" "}
                    {item.produto_descricao}
                  </span>
                  <span className="font-semibold text-brand-dark shrink-0">
                    R$ {item.valor_total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </details>

          {/* ── STEP 1: Tipo de Venda ── */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Tipo de Venda
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["Direta", "Comanda"] as const).map((t) => (
                <button
                  key={t}
                  id={`tipo-${t.toLowerCase()}`}
                  onClick={() => {
                    setTipoVenda(t);
                    setSelectedComanda("");
                    setNomeComanda("");
                    setValorRecebido("");
                  }}
                  className={`
                    py-4 rounded-2xl font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center gap-1.5
                    ${tipoVenda === t
                      ? "border-brand-blue bg-gradient-to-br from-blue-50 to-blue-100/60 text-brand-blue shadow-md shadow-blue-100 ring-4 ring-blue-500/10"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:shadow-sm"
                    }
                  `}
                >
                  <span className="text-2xl">{t === "Direta" ? "💳" : "📋"}</span>
                  <span>{t}</span>
                  <span className="text-[10px] font-normal opacity-60">
                    {t === "Direta" ? "Paga agora" : "Paga depois"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── STEP 2A: Se COMANDA → seleção/criação de comanda ── */}
          {tipoVenda === "Comanda" && (
            <div className="animate-slide-in">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Vincular à Comanda
              </label>

              {comandas.length > 0 && (
                <select
                  id="select-comanda"
                  value={selectedComanda}
                  onChange={(e) =>
                    setSelectedComanda(
                      e.target.value === "nova" ? "nova" : Number(e.target.value)
                    )
                  }
                  className="select mb-3"
                >
                  <option value="">Selecione ou crie uma comanda...</option>
                  <option value="nova">+ CRIAR NOVA COMANDA</option>
                  {comandas.map((c) => (
                    <option key={c.id} value={c.id}>
                      Comanda #{c.numero}{c.nome ? ` — ${c.nome}` : ""}
                    </option>
                  ))}
                </select>
              )}

              {comandas.length === 0 && (
                <button
                  onClick={() => setSelectedComanda("nova")}
                  className={`w-full py-3.5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 mb-3 ${
                    selectedComanda === "nova"
                      ? "border-brand-blue bg-gradient-to-br from-blue-50 to-blue-100/60 text-brand-blue shadow-md"
                      : "border-brand-blue text-brand-blue bg-blue-50 hover:shadow-sm"
                  }`}
                >
                  + CRIAR NOVA COMANDA
                </button>
              )}

              {/* Nome da comanda (nova ou selecionada existente) */}
              {selectedComanda === "nova" && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-50/40 border-2 border-blue-200 rounded-2xl p-4 animate-slide-in">
                  <label className="block text-xs font-bold text-brand-blue uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FiUser size={12} />
                    Nome da comanda <span className="text-gray-400 font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={nomeComanda}
                    onChange={(e) => setNomeComanda(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 bg-white text-sm font-medium text-brand-dark
                               focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                               placeholder-gray-300 transition-all duration-200"
                    placeholder='Ex: "Mesa 3", "João", "Família Silva"'
                    id="nome-comanda-input"
                    autoFocus
                  />
                </div>
              )}

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-amber-500 mt-0.5 shrink-0">ℹ️</span>
                <p className="text-xs text-amber-700 font-medium">
                  O cliente pagará ao fechar a comanda. O pagamento não será registrado agora.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2B: Se DIRETA → meios de pagamento ── */}
          {tipoVenda === "Direta" && (
            <div className="animate-slide-in">
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {METODOS.map(({ key, icon: Icon, color }) => {
                    const style = getMetodoStyle(key, color);
                    return (
                      <button
                        key={key}
                        id={`payment-${key.toLowerCase().replace(/ /g, "-")}`}
                        onClick={() => {
                          setMetodo(key);
                          if (key !== "Dinheiro") setValorRecebido("");
                        }}
                        className={`
                          relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200
                          ${style.button}
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${style.iconContainer}`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-sm text-left leading-tight ${style.label}`}>
                          {key}
                        </span>
                        {metodo === key && (
                          <div className="absolute top-2 right-2">
                            <FiCheckCircle size={14} className="text-current opacity-60" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash input */}
              {metodo === "Dinheiro" && (
                <div className="mb-6 animate-slide-in">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FiDollarSign size={14} />
                      Valor Recebido do Cliente
                      <span className="text-red-500 text-sm">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={valorRecebido}
                        onChange={(e) => setValorRecebido(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-emerald-200 bg-white text-lg font-bold text-brand-dark
                                   focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500
                                   placeholder-gray-300 transition-all duration-200"
                        placeholder="0,00"
                        id="payment-valor-recebido"
                        autoFocus
                      />
                    </div>

                    {valorRecebido !== "" && valorRecebidoNum < total && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-500 font-medium animate-slide-in">
                        <FiAlertCircle size={14} />
                        Valor insuficiente. Faltam R$ {(total - valorRecebidoNum).toFixed(2).replace(".", ",")}
                      </div>
                    )}

                    {troco > 0 && (
                      <div className="mt-4 bg-white rounded-xl p-4 flex items-center justify-between border border-emerald-200 animate-slide-in">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FiDollarSign className="text-emerald-600" size={16} />
                          </div>
                          <span className="text-sm font-semibold text-gray-600">Troco</span>
                        </div>
                        <span className="text-xl font-extrabold text-emerald-600">
                          R$ {troco.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    )}

                    {/* Quick value buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[5, 10, 20, 50, 100].filter((v) => v >= total).slice(0, 4).map((valor) => (
                        <button
                          key={valor}
                          onClick={() => setValorRecebido(String(valor))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
                            ${valorRecebidoNum === valor
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                        >
                          R$ {valor},00
                        </button>
                      ))}
                      <button
                        onClick={() => setValorRecebido(total.toFixed(2))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
                          ${valorRecebidoNum === total
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                      >
                        Exato
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="btn-ghost flex-1 py-3.5" id="payment-cancel-btn">
            Cancelar
          </button>
          <button
            id="payment-confirm-btn"
            onClick={handleConfirmClick}
            disabled={!canConfirm}
            className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-200
              flex items-center justify-center gap-2
              ${canConfirm
                ? "bg-gradient-to-r from-brand-red to-rose-600 text-white shadow-lg shadow-brand-red/25 hover:shadow-xl hover:shadow-brand-red/30 active:scale-[0.97]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {!tipoSelecionado ? (
              "Selecione o tipo"
            ) : tipoVenda === "Direta" && metodo === "Dinheiro" && !dinheiroValido ? (
              <>
                <FiDollarSign size={16} />
                Informe o valor
              </>
            ) : tipoVenda === "Comanda" && !comandaValida ? (
              "Selecione a comanda"
            ) : (
              <>
                <FiCheckCircle size={16} />
                Confirmar Venda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
