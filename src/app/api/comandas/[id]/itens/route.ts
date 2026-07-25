import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      produto_id,
      produto_descricao,
      quantidade,
      valor_unitario,
      valor_total,
      teve_promocao,
    } = body;

    // Verify comanda exists and is open
    const comanda = await prisma.comanda.findUnique({ 
      where: { id: Number(id) },
      include: { itens: true } 
    });
    if (!comanda) {
      return NextResponse.json({ error: "Comanda não encontrada" }, { status: 404 });
    }
    if (comanda.status !== "aberta") {
      return NextResponse.json({ error: "Comanda já está fechada" }, { status: 400 });
    }

    const existingItem = comanda.itens.find((i) => i.produto_id === Number(produto_id));
    const qtyToAdd = Number(quantidade);
    const finalQty = existingItem ? Number(existingItem.quantidade) + qtyToAdd : qtyToAdd;

    // Recalculate price always to account for promotions based on the new final quantity
    const produto = await prisma.produto.findUnique({
      where: { id: Number(produto_id) },
      include: { promocoes: { orderBy: { quantidade_minima: "desc" } } },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    let calcValorUnitario = produto.valor;
    let calcTevePromocao = false;

    for (const promo of produto.promocoes) {
      if (finalQty >= promo.quantidade_minima) {
        calcValorUnitario = promo.preco_promocional;
        calcTevePromocao = true;
        break;
      }
    }

    const calcValorTotal = Number(calcValorUnitario) * finalQty;

    let item;
    if (existingItem) {
      item = await prisma.comandaItem.update({
        where: { id: existingItem.id },
        data: {
          quantidade: finalQty,
          valor_unitario: calcValorUnitario,
          valor_total: calcValorTotal,
          teve_promocao: calcTevePromocao,
        },
        include: { produto: true },
      });
    } else {
      item = await prisma.comandaItem.create({
        data: {
          comanda_id: Number(id),
          produto_id: Number(produto_id),
          produto_descricao: produto.descricao,
          quantidade: finalQty,
          valor_unitario: calcValorUnitario,
          valor_total: calcValorTotal,
          teve_promocao: calcTevePromocao,
        },
        include: { produto: true },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao adicionar item à comanda" }, { status: 500 });
  }
}
