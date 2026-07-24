import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;

    // Verify item belongs to this comanda
    const item = await prisma.comandaItem.findFirst({
      where: { id: Number(itemId), comanda_id: Number(id) },
    });

    if (!item) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    await prisma.comandaItem.delete({ where: { id: Number(itemId) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover item" }, { status: 500 });
  }
}
