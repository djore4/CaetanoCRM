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

1. Cria um projeto Supabase **dedicado** e aplica `supabase/migrations/*.sql`.
2. Em *Authentication → Sign In / Providers* cria os 2 utilizadores (email + palavra-passe) e **desativa o registo público**.
3. Os 2 primeiros utilizadores criados ficam com os lugares A e B (trigger em `auth.users`); RLS impede qualquer outro de ler ou escrever.
4. As faturas ficam no bucket privado `invoices`; o browser carrega-as diretamente (limite de 4,5 MB do Vercel não se aplica).

## Deploy (Vercel)

Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ANTHROPIC_API_KEY`.

## Estado

Splitwise foi substituído: o saldo é calculado na app a partir das despesas (pagador + divisão) e dos acertos. Ainda não testado contra uma base real; sem testes automáticos, sem despesas recorrentes, sem importação do histórico do Splitwise.
