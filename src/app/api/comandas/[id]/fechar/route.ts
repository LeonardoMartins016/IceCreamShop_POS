import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pagamentos } = body;

    if (!pagamentos || pagamentos.length === 0) {
      return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 });
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

    const totalPago = pagamentos.reduce((acc: number, p: { valor: number }) => acc + Number(p.valor), 0);
    if (Math.round(totalPago * 100) < Math.round(total * 100)) {
      return NextResponse.json({ error: "Valor pago menor que o total" }, { status: 400 });
    }

    const troco = Math.max(0, Number((totalPago - total).toFixed(2)));

    // Criar resumo textual (ex: "R$ 25,00 Dinheiro + R$ 25,00 Cartão de Crédito")
    let metodo_pagamento_resumo = pagamentos
      .map((p: { metodo: string; valor: number }) => `R$ ${Number(p.valor).toFixed(2).replace(".", ",")} ${p.metodo}`)
      .join(" + ");

    if (troco > 0) {
      metodo_pagamento_resumo += ` (Troco: R$ ${troco.toFixed(2).replace(".", ",")})`;
    }


    // Create venda and items, then close comanda — all in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.create({
        data: {
          total,
          metodo_pagamento: metodo_pagamento_resumo,
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
          pagamentos: {
            create: pagamentos.map((p: { metodo: string; valor: number }) => ({
              metodo_pagamento: p.metodo,
              valor: p.valor,
            })),
          },
        },
        include: { itens: true, pagamentos: true },
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
