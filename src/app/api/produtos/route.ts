import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      include: { promocoes: true },
      orderBy: { descricao: "asc" },
    });
    return NextResponse.json(produtos);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descricao, valor, tipo } = body;

    if (!descricao || valor === undefined || !tipo) {
      return NextResponse.json({ error: "Campos obrigatórios: descricao, valor, tipo" }, { status: 400 });
    }

    const produto = await prisma.produto.create({
      data: { descricao, valor, tipo },
    });
    return NextResponse.json(produto, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
