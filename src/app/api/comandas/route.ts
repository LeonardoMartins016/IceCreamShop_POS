import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const comandas = await prisma.comanda.findMany({
      where: { status: "aberta" },
      include: {
        itens: {
          include: { produto: true },
        },
      },
      orderBy: { numero: "asc" },
    });
    return NextResponse.json(comandas);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar comandas" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Auto-increment numero based on max existing
    const last = await prisma.comanda.findFirst({
      orderBy: { numero: "desc" },
    });
    const numero = (last?.numero ?? 0) + 1;

    const comanda = await prisma.comanda.create({
      data: { numero },
    });
    return NextResponse.json(comanda, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar comanda" }, { status: 500 });
  }
}
