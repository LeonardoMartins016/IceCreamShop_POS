import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { metodo_pagamento } = body;

    if (!metodo_pagamento || !["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"].includes(metodo_pagamento)) {
      return NextResponse.json({ error: "Método de pagamento inválido" }, { status: 400 });
    }

    const comanda = await prisma.comanda.findUnique({
      where: { id: Number(id) },
      include: { itens: true },
    });

    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }
    if (comanda.status !== "aberta") {
      return NextResponse.json({ error: "Comanda já está fechada" }, { status: 400 });
    }
    if (comanda.itens.length === 0) {
      return NextResponse.json({ error: "Comanda sem itens" }, { status: 400 });
    }

    const total = comanda.itens.reduce(
      (acc, item) => acc + Number(item.valor_total),
      0
    );

    // Create venda and items, then close comanda — all in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.create({
        data: {
          total,
          metodo_pagamento,
          tipo: "Comanda",
          numero_comanda: comanda.numero,
          itens: {
            create: comanda.itens.map((item) => ({
              produto_id: item.produto_id,
              produto_descricao: item.produto_descricao,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total,
              teve_promocao: item.teve_promocao,
            })),
          },
        },
        include: { itens: true },
      });

      await tx.comanda.update({
        where: { id: Number(id) },
        data: { status: "fechada" },
      });

      return venda;
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro ao fechar comanda" }, { status: 500 });
  }
}
