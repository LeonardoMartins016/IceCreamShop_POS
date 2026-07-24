"use client";

import { useState } from "react";
import { FiSearch, FiPlus, FiTag } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";

interface Promocao {
  id: number;
  quantidade_minima: number;
  preco_promocional: string | number;
}

interface Produto {
  id: number;
  descricao: string;
  valor: string | number;
  tipo: string;
  promocoes: Promocao[];
}

interface ProductGridProps {
  produtos: Produto[];
  onSelectProduct: (produto: Produto) => void;
}

export default function ProductGrid({ produtos, onSelectProduct }: ProductGridProps) {
  const [search, setSearch] = useState("");

  const filtered = produtos.filter((p) =>
    p.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search */}
      <div className="relative">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          id="busca-produto"
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <GiIceCreamCone className="text-gray-200 mb-4" size={64} />
          <p className="text-gray-400 font-medium">Nenhum produto encontrado</p>
          <p className="text-gray-300 text-sm mt-1">
            {search ? "Tente outro termo de busca" : "Cadastre produtos no painel Admin"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-2">
          {filtered.map((produto) => {
            const hasPromo = produto.promocoes && produto.promocoes.length > 0;
            const minPromo = hasPromo
              ? Math.min(...produto.promocoes.map((p) => p.quantidade_minima))
              : null;

            return (
              <button
                key={produto.id}
                id={`produto-${produto.id}`}
                onClick={() => onSelectProduct(produto)}
                className="
                  group relative card card-hover flex flex-col items-start p-4 text-left
                  border border-transparent hover:border-brand-red/20 active:scale-[0.98]
                  transition-all duration-150
                "
              >
                {/* Promo badge */}
                {hasPromo && (
                  <span className="absolute top-2 right-2 tag-promo">
                    <FiTag size={10} />
                    Promo
                  </span>
                )}

                {/* Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-brand-red/10 to-brand-orange/10 rounded-xl flex items-center justify-center mb-3 group-hover:from-brand-red/20 group-hover:to-brand-orange/20 transition-colors">
                  <GiIceCreamCone className="text-brand-red" size={22} />
                </div>

                {/* Info */}
                <p className="text-sm font-semibold text-brand-dark leading-snug line-clamp-2 mb-2">
                  {produto.descricao}
                </p>

                <div className="mt-auto w-full">
                  <p className="text-brand-red font-bold text-base">
                    R$ {Number(produto.valor).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    {produto.tipo === "KG" ? "por kg" : "unidade"}
                    {hasPromo && minPromo && ` · Promo a partir de ${minPromo}`}
                  </p>
                </div>

                {/* Add icon */}
                <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand-red rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <FiPlus className="text-white" size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
