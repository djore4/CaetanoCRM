# Casa (nome provisório)

App doméstica para duas pessoas: despesas partilhadas, conta corrente e listas.

## Funcionalidades (rascunho v0.1)

1. **Despesas** – upload de fatura (PDF/foto) → o Claude lê fornecedor, categoria, valor e data → confirmas e guardas. Resumo mensal com total, variação vs. mês anterior, gastos por categoria e tendência de 6 meses.
2. **Conta corrente + Splitwise** – cada despesa tem pagador e divisão (por defeito 50/50); o saldo "quem deve quanto a quem" é calculado na app e a despesa pode ser lançada no Splitwise via API.
3. **Listas** – criar, editar e apagar listas (supermercado, Natal, pendentes…) com itens que se marcam/editam/removem. Colar várias linhas cria vários itens.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # URL + chave publicável do Supabase (+ ANTHROPIC_API_KEY opcional)
npm run dev                  # http://localhost:3000
```

## Base de dados (Supabase)

Tudo vive em tabelas `casa_*` e no bucket privado `casa-invoices` (migração em `supabase/migrations/`). Não há triggers em `auth.users`.

**Quem tem acesso:** só os emails listados em `casa_members` (máx. 2, lugares `a` e `b`). Qualquer outro utilizador autenticado do projeto vê 0 linhas e não consegue escrever (RLS). Para configurar, no SQL editor:

```sql
insert into public.casa_members (email, slot, name) values
  ('o-teu-email@exemplo.com', 'a', 'João'),
  ('email-da-parceira@exemplo.com', 'b', 'Nome');   -- emails em minúsculas
```

Cada pessoa precisa de uma conta em *Authentication → Users* (email + palavra-passe, "Auto Confirm User" ligado). Contas que já existam no projeto servem.

## Deploy (Vercel)

Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY`.

## Estado

Splitwise foi substituído: o saldo é calculado na app a partir das despesas (pagador + divisão) e dos acertos. Ainda não testado contra uma base real; sem testes automáticos, sem despesas recorrentes, sem importação do histórico do Splitwise.
