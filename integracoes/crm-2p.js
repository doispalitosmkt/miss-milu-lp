// Envio do lead do formulário também para a plataforma da agência Dois Palitos (CRM 2P).
//
// Regras:
//  - NÃO interfere no RD Station: roda em paralelo, com tempo limite, e qualquer falha fica só no log.
//  - Só envia quando o segredo LEAD_2P_SECRET está configurado no Cloudflare Pages (sem ele, não faz nada).
//  - Assinatura HMAC-SHA256 (o segredo nunca vai para o navegador) e o mesmo ID em cada tentativa,
//    então reenviar não duplica o lead.
//  - Nome começando com "[TESTE]" marca o lead como teste (fica fora dos painéis).

const URL_PADRAO = 'https://api.stg.doispalitosmkt.com.br/v1/leads';
const FONTE_PADRAO = 'lp-miss-milu';
const TENTATIVAS = 3;
const TEMPO_LIMITE_MS = 8000;

function texto(valor, max) {
  if (typeof valor !== 'string') return null;
  const limpo = valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return limpo || null;
}

function dataIso(valor) {
  if (typeof valor !== 'string') return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  // não aceita datas no futuro nem muito antigas (relógio errado do visitante)
  const agora = Date.now();
  if (d.getTime() > agora + 5 * 60_000 || d.getTime() < agora - 90 * 86_400_000) return null;
  return d.toISOString();
}

const CLIQUES = ['gclid', 'gbraid', 'wbraid', 'fbclid'];

/** Toque de marketing vindo do navegador (página de entrada + de onde veio), com limites de tamanho. */
function toque(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;
  const t = {
    occurred_at: dataIso(bruto.quando),
    landing_url: texto(bruto.pagina, 2048),
    referrer: texto(bruto.veioDe, 2048),
  };
  if (!t.landing_url && !t.referrer) return null;
  return t;
}

/** Monta o lead no formato v1 da plataforma 2P (contrato em doispalitosmkt/2p-martech). */
export function montarLead2p(lead, atribuicao, opcoes = {}) {
  const agora = opcoes.agora || new Date();
  const primeiro = toque(atribuicao && atribuicao.primeiro);
  const ultimo = toque(atribuicao && atribuicao.ultimo);
  const campo = (id, rotulo, tipo, valor) => ({ id, label: rotulo, type: tipo, value: valor || null });
  const payload = {
    schema_version: 1,
    submission_id: opcoes.id || crypto.randomUUID(),
    source_system: 'lp-miss-milu-cloudflare',
    submitted_at: agora.toISOString(),
    form: {
      id: 'orcamento-lp',
      name: 'Orçamento (LP Miss Milú)',
      page_url: texto(lead.pageUrl, 2048),
      page_title: 'Miss Milú | Caixas rígidas personalizadas',
    },
    fields: [
      campo('nome', 'Nome', 'text', lead.nome),
      campo('email', 'E-mail', 'email', lead.email),
      campo('whatsapp', 'WhatsApp', 'tel', lead.whatsapp),
      campo('empresa', 'Empresa', 'text', lead.empresa),
      campo('segmento', 'Segmento', 'select', lead.segmento),
      campo('quantidade', 'Quantidade estimada', 'select', lead.quantidade),
      campo('descricao', 'Sobre o projeto', 'textarea', lead.descricao),
    ],
    attribution: {
      first_touch: primeiro,
      last_touch: ultimo,
      page_referrer: texto(atribuicao && atribuicao.referrerDaPagina, 2048),
    },
    consent: { marketing: null, privacy_notice_version: null },
  };
  if (/^\s*\[TESTE\]/i.test(lead.nome || '')) payload.test = true;
  return payload;
}

async function assinar(segredo, carimbo, corpo) {
  const codificador = new TextEncoder();
  const chave = await crypto.subtle.importKey('raw', codificador.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', chave, codificador.encode(carimbo + '.' + corpo));
  return 'v1=' + Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('');
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envia ao CRM 2P. Nunca lança erro: devolve { enviado, status, motivo } para log e testes.
 * Repete em queda de rede, 429 e 5xx; não repete erro de dado (4xx).
 */
export async function enviarLeadPara2p(lead, atribuicao, env, fetchImpl = fetch, opcoes = {}) {
  try {
    const segredo = env && env.LEAD_2P_SECRET;
    if (!segredo) return { enviado: false, motivo: 'nao_configurado' };
    const url = (env && env.LEAD_2P_URL) || URL_PADRAO;
    const fonte = (env && env.LEAD_2P_SOURCE) || FONTE_PADRAO;
    const payload = montarLead2p(lead, atribuicao, opcoes);
    const corpo = JSON.stringify(payload);
    const pausa = opcoes.pausaMs === undefined ? 1000 : opcoes.pausaMs;
    let ultimo = { enviado: false, motivo: 'sem_tentativa' };

    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      try {
        const carimbo = String(Math.floor(Date.now() / 1000));
        const resposta = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-2P-Source': fonte,
            'X-2P-Timestamp': carimbo,
            'X-2P-Signature': await assinar(segredo, carimbo, corpo),
            'Idempotency-Key': payload.submission_id,
          },
          body: corpo,
          signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        });
        if (resposta.ok) return { enviado: true, status: resposta.status, id: payload.submission_id };
        ultimo = { enviado: false, status: resposta.status, motivo: 'http' };
        if (resposta.status < 500 && resposta.status !== 429) break;
      } catch (erro) {
        ultimo = { enviado: false, motivo: erro && erro.name === 'TimeoutError' ? 'tempo_esgotado' : 'rede' };
      }
      if (tentativa < TENTATIVAS) await esperar(pausa * tentativa);
    }
    console.error('CRM 2P: lead não enviado', ultimo.status || ultimo.motivo);
    return ultimo;
  } catch {
    console.error('CRM 2P: falha inesperada ao preparar o envio');
    return { enviado: false, motivo: 'falha_inesperada' };
  }
}
