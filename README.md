# Doce Sabor — Sistema PDV Web

Sistema de Ponto de Venda (PDV) web para a sorveteria **Doce Sabor**, construído com Next.js 15 (App Router), Prisma e PostgreSQL (Neon). Pronto para deploy no Render.

---

## 🗂️ Funcionalidades

- **Caixa**: Selecionar produtos, calcular promoções automaticamente, montar carrinho e finalizar venda (Dinheiro ou PIX)
- **Comandas**: Criar e gerenciar mesas/pedidos em aberto, adicionar itens e fechar com pagamento
- **Vendas**: Histórico com filtros por data, pagamento e tipo
- **Admin** (protegido por senha): CRUD de produtos e promoções, relatório de vendas

---

## 🚀 Deploy no Render + Neon

### 1. Criar banco de dados no Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto (ex: `doce-sabor`)
3. Copie a **Connection String** no formato:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
   > ⚠️ Certifique-se que `?sslmode=require` está no final da URL

### 2. Configurar variáveis de ambiente no Render

No painel do Render, na aba **Environment**, adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | String de conexão do Neon (com `?sslmode=require`) |
| `ADMIN_PASSWORD` | Senha do painel admin (padrão: `Admin`) |
| `NODE_ENV` | `production` |

### 3. Configurar o Web Service no Render

1. Conecte seu repositório GitHub
2. Configure o serviço:
   - **Build Command**: `npm install && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 20+

> O comando `npx prisma db push` cria as tabelas automaticamente no Neon na primeira vez (e aplica mudanças de schema depois).

### 4. Deploy

Clique em **Deploy** — o Render fará o build e iniciará o serviço. Após o deploy, acesse a URL fornecida.

---

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- npm
- Conta no Neon (ou PostgreSQL local)

### Instalação

```bash
# Clone o repositório
git clone <seu-repo-url>
cd projectDoceSabor

# Instale as dependências (prisma generate é executado automaticamente)
npm install

# Configure o ambiente
cp .env.example .env
# Edite .env e coloque sua DATABASE_URL e ADMIN_PASSWORD
```

### Configurar banco de dados

```bash
# Criar/atualizar tabelas no banco
npx prisma db push

# (Opcional) Ver os dados no Prisma Studio
npx prisma studio
```

### Executar em desenvolvimento

```bash
npm run dev
# Acesse http://localhost:3000
```

---

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
ADMIN_PASSWORD="Admin"
```

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | String de conexão PostgreSQL (Neon) | ✅ |
| `ADMIN_PASSWORD` | Senha do painel administrativo | ✅ (padrão: `Admin`) |

---

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx              # Caixa (PDV principal)
│   ├── layout.tsx            # Layout raiz + sidebar
│   ├── globals.css           # Design system + Tailwind
│   ├── comandas/page.tsx     # Gerenciar comandas
│   ├── vendas/page.tsx       # Histórico de vendas
│   ├── admin/page.tsx        # Painel administrativo
│   └── api/
│       ├── produtos/         # CRUD produtos
│       ├── promocoes/        # CRUD promoções
│       ├── calcular-preco/   # Cálculo de preço com promoção
│       ├── comandas/         # CRUD comandas + fechar
│       ├── vendas/           # Histórico + resumo
│       └── admin/            # Auth (login/logout/check)
├── components/
│   ├── Sidebar.tsx
│   ├── ProductGrid.tsx
│   ├── Cart.tsx
│   ├── QuantityModal.tsx
│   └── PaymentModal.tsx
└── lib/
    └── prisma.ts             # Singleton PrismaClient

prisma/
└── schema.prisma             # Schema do banco de dados
```

---

## 🎨 Identidade Visual

| Cor | Hex | Uso |
|-----|-----|-----|
| Vermelho/Bordô | `#C13B56` | Logo, botões primários, destaques |
| Azul | `#3E6FB0` | Textos, botões secundários |
| Laranja | `#E8834B` | Botões de ação, badges |
| Fundo | `#F7F7F9` | Background geral |
| Texto | `#1A1A2E` | Texto principal |

---

## 📋 Lógica de Promoções

Ao adicionar um produto ao carrinho, o backend (`/api/calcular-preco`) verifica se existe promoção para o produto com `quantidade_minima ≤ quantidade informada`. A promoção com a **maior quantidade mínima atingida** é aplicada (a mais específica/vantajosa), e o campo `teve_promocao` é marcado como `true`.

---

## 🗄️ Schema do Banco

O schema Prisma (`prisma/schema.prisma`) mapeia 6 tabelas:
- `produtos` — catálogo de produtos
- `promocoes` — preços especiais por quantidade
- `comandas` — mesas/pedidos em aberto
- `comanda_itens` — itens de cada comanda
- `vendas` — vendas finalizadas
- `venda_itens` — itens de cada venda

---

## 🔐 Acesso Admin

- Acesse `/admin`
- Digite a senha configurada em `ADMIN_PASSWORD` (padrão: `Admin`)
- Para alterar a senha, mude a variável de ambiente no Render (sem necessidade de redeploy, apenas reiniciar o serviço)
