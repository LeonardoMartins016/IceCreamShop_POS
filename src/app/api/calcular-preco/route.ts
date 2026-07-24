import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_id, quantidade } = body;

    if (!produto_id || quantidade === undefined) {
      return NextResponse.json({ error: "produto_id e quantidade são obrigatórios" }, { status: 400 });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: Number(produto_id) },
      include: {
        promocoes: {
          orderBy: { quantidade_minima: "desc" },
        },
      },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const qty = Number(quantidade);
    let valorUnitario: Decimal = produto.valor;
    let tevePromocao = false;

    // Apply the promotion with the highest minimum quantity that is still met
    for (const promo of produto.promocoes) {
      if (qty >= promo.quantidade_minima) {
        valorUnitario = promo.preco_promocional;
        tevePromocao = true;
        break;
      }
    }

    const valorTotal = Number(valorUnitario) * qty;

    return NextResponse.json({
      produto_id: produto.id,
      produto_descricao: produto.descricao,
      tipo: produto.tipo,
      quantidade: qty,
      valor_unitario: Number(valorUnitario),
      valor_total: Math.round(valorTotal * 100) / 100,
      teve_promocao: tevePromocao,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao calcular preço" }, { status: 500 });
  }
}
