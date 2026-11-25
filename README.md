# Casa (nome provisório)

App doméstica para duas pessoas: despesas partilhadas, conta corrente e listas.

## Funcionalidades (rascunho v0.1)

1. **Despesas** – upload de fatura (PDF/foto) → o Claude lê fornecedor, categoria, valor e data → confirmas e guardas. Resumo mensal com total, variação vs. mês anterior, gastos por categoria e tendência de 6 meses.
2. **Conta corrente + Splitwise** – cada despesa tem pagador e divisão (por defeito 50/50); o saldo "quem deve quanto a quem" é calculado na app e a despesa pode ser lançada no Splitwise via API.
3. **Listas** – criar, editar e apagar listas (supermercado, Natal, pendentes…) com itens que se marcam/editam/removem. Colar várias linhas cria vários itens.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # opcional: chaves Anthropic / Splitwise
npm run dev                  # http://localhost:3000
```

Sem chaves, a app funciona com preenchimento manual. `DEMO_DATA=false` arranca sem dados de exemplo; `npm run reset-db` apaga os dados locais.

## Estado do rascunho (o que ainda NÃO está feito)

- **Sem login**: o seletor João/Parceira no topo só escolhe quem está a "ver". Não é segurança.
- **Persistência em ficheiro JSON** (`data/db.json`), isolada em `src/lib/db.ts`. Não serve para deploy em Vercel; o passo seguinte é Supabase (Postgres + Auth + Storage).
- **Splitwise não testado** contra uma conta real; só cria despesas (não lê nem sincroniza o saldo de volta).
- Sem editar despesas já guardadas (só apagar), sem despesas recorrentes, sem testes automáticos.
