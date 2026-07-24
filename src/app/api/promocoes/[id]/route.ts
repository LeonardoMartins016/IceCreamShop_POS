import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { produto_id, quantidade_minima, preco_promocional } = body;

    const promocao = await prisma.promocao.update({
      where: { id: Number(id) },
      data: { produto_id, quantidade_minima, preco_promocional },
      include: { produto: true },
    });
    return NextResponse.json(promocao);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar promoção" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.promocao.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir promoção" }, { status: 500 });
  }
}
