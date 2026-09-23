const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Populando banco de dados local com produtos de exemplo...');

  const count = await prisma.produto.count();
  if (count > 0) {
    console.log('Banco de dados já contém produtos.');
    return;
  }

  const produtos = [
    { descricao: 'Sorvete de Massa (KG)', valor: 59.90, tipo: 'KG' },
    { descricao: 'Açaí Tradicional (KG)', valor: 64.90, tipo: 'KG' },
    { descricao: 'Picolé Frutas (UN)', valor: 4.50, tipo: 'UN' },
    { descricao: 'Picolé Especial Recheado (UN)', valor: 7.50, tipo: 'UN' },
    { descricao: 'Paleta Mexicana (UN)', valor: 12.00, tipo: 'UN' },
    { descricao: 'Cascão Trufado (UN)', valor: 6.00, tipo: 'UN' },
    { descricao: 'Cestinha Waffle (UN)', valor: 4.00, tipo: 'UN' },
    { descricao: 'Água Mineral 500ml (UN)', valor: 4.00, tipo: 'UN' },
    { descricao: 'Refrigerante Lata (UN)', valor: 6.00, tipo: 'UN' },
    { descricao: 'Milk Shake 500ml (UN)', valor: 18.00, tipo: 'UN' },
  ];

  for (const item of produtos) {
    const prod = await prisma.produto.create({
      data: item
    });

    // Se for Picolé Frutas, adiciona promoção: a partir de 5 unidades, sai por R$ 3,80 cada
    if (prod.descricao.includes('Picolé Frutas')) {
      await prisma.promocao.create({
        data: {
          produto_id: prod.id,
          quantidade_minima: 5,
          preco_promocional: 3.80
        }
      });
    }

    // Se for Picolé Especial, adiciona promoção: a partir de 4 unidades, sai por R$ 6,50 cada
    if (prod.descricao.includes('Picolé Especial')) {
      await prisma.promocao.create({
        data: {
          produto_id: prod.id,
          quantidade_minima: 4,
          preco_promocional: 6.50
        }
      });
    }
  }

  // Criar 2 comandas de exemplo abertas
  await prisma.comanda.create({
    data: {
      numero: 1,
      nome: 'Mesa 01',
      status: 'aberta'
    }
  });

  await prisma.comanda.create({
    data: {
      numero: 2,
      nome: 'Balcão / João',
      status: 'aberta'
    }
  });

  console.log('Banco de dados local populado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
