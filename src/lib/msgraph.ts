/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PublicClientApplication } from "@azure/msal-browser";

/** Acesso só de leitura (Mail.Read) à caixa Outlook/Hotmail, a partir do browser (OAuth PKCE).
 *  Nenhum token fica em servidor: a sessão vive em sessionStorage e perde-se ao fechar o separador. */

const CLIENT_ID = process.env.NEXT_PUBLIC_MS_CLIENT_ID ?? "";
const SCOPES = ["Mail.Read"];
const GRAPH = "https://graph.microsoft.com/v1.0";

export const msConfigured = () => CLIENT_ID.length > 0;

let app: Promise<PublicClientApplication> | null = null;
function client() {
  app ??= (async () => {
    const { PublicClientApplication } = await import("@azure/msal-browser");
    const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
    const a = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/consumers", // contas pessoais (hotmail/outlook)
        redirectUri: `${window.location.origin}${base}/importar/`,
      },
      cache: { cacheLocation: "sessionStorage" },
    });
    await a.initialize();
    return a;
  })();
  return app;
}

/** Chamar no arranque da página: conclui o redirect do login, se vier de um. */
export async function msCompleteRedirect(): Promise<string | null> {
  if (!msConfigured()) return null;
  const a = await client();
  const res = await a.handleRedirectPromise();
  if (res?.account) a.setActiveAccount(res.account);
  else if (!a.getActiveAccount()) {
    const acc = a.getAllAccounts()[0];
    if (acc) a.setActiveAccount(acc);
  }
  return a.getActiveAccount()?.username ?? null;
}

export async function msLogin() {
  const a = await client();
  await a.loginRedirect({ scopes: SCOPES, prompt: "select_account" });
}

export async function msLogout() {
  const a = await client();
  const account = a.getActiveAccount() ?? undefined;
  await a.logoutRedirect({ account, postLogoutRedirectUri: window.location.href });
}

async function token(): Promise<string> {
  const a = await client();
  const account = a.getActiveAccount();
  if (!account) throw new Error("Sem sessão Microsoft");
  try {
    return (await a.acquireTokenSilent({ scopes: SCOPES, account })).accessToken;
  } catch {
    await a.acquireTokenRedirect({ scopes: SCOPES, account });
    throw new Error("A redirecionar para a Microsoft…");
  }
}

async function graph(path: string, accept?: "json" | "blob"): Promise<any> {
  const url = path.startsWith("http") ? path : `${GRAPH}${path}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${await token()}` } });
    if (r.status === 429 || r.status === 503) {
      await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`Microsoft Graph ${r.status}`);
    return accept === "blob" ? r.blob() : r.json();
  }
  throw new Error("Microsoft Graph indisponível, tenta mais tarde");
}

export interface MailMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  preview: string;
  hasAttachments: boolean;
}

const KEYWORDS = /fatura|factura|invoice|recibo|receipt|pagamento|d[eé]bito|cobran[cç]a|extrato|referência multibanco|multibanco/i;

/** Mensagens dos últimos `days` dias que podem ser faturas: com PDF/imagem anexo ou com palavras-chave. */
export async function listCandidates(days: number, max = 600): Promise<MailMessage[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  let url: string | undefined =
    `/me/messages?$filter=${encodeURIComponent(`receivedDateTime ge ${since}`)}` +
    `&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments&$orderby=receivedDateTime desc&$top=50`;
  const out: MailMessage[] = [];
  while (url && out.length < max) {
    const page: any = await graph(url);
    for (const m of page.value as any[]) {
      const text = `${m.subject ?? ""} ${m.bodyPreview ?? ""}`;
      if (!m.hasAttachments && !KEYWORDS.test(text)) continue;
      out.push({
        id: m.id,
        subject: m.subject ?? "",
        from: m.from?.emailAddress?.address ?? "",
        receivedAt: m.receivedDateTime,
        preview: m.bodyPreview ?? "",
        hasAttachments: !!m.hasAttachments,
      });
    }
    url = page["@odata.nextLink"];
  }
  return out;
}

export interface MailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
}

/** Anexos úteis: PDF, ou imagem não inline com tamanho razoável (ignora logótipos de assinaturas). */
export async function listAttachments(messageId: string): Promise<MailAttachment[]> {
  const r = await graph(`/me/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline`);
  return (r.value as any[])
    .filter((a) => {
      const pdf = a.contentType === "application/pdf" || /\.pdf$/i.test(a.name ?? "");
      const img = /^image\/(jpeg|png|webp)$/.test(a.contentType) && !a.isInline && a.size > 30_000;
      return (pdf || img) && a.size <= 12 * 1024 * 1024;
    })
    .map((a) => ({ id: a.id, name: a.name, contentType: a.contentType, size: a.size }));
}

export async function downloadAttachment(messageId: string, attachmentId: string): Promise<Blob> {
  return graph(`/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/$value`, "blob");
}
