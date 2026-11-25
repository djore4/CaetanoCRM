import { signIn } from "../actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <form action={signIn} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-5xl">🏡</div>
          <h1 className="text-2xl font-bold mt-2">Casa</h1>
          <p className="text-sm text-muted">Entra para ver as contas e as listas.</p>
        </div>
        {erro && <p className="text-sm text-red-500 text-center">Email ou palavra-passe incorretos.</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Palavra-passe</label>
          <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
        </div>
        <button className="btn w-full">Entrar</button>
      </form>
    </div>
  );
}
