import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { handleLeadRequest } from '../functions/api/rd-crm-lead.js';
import { enviarLeadPara2p, montarLead2p } from '../integracoes/crm-2p.js';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres-0123456789';

const lead = {
  nome: 'Maria da Silva',
  email: 'maria@exemplo.com',
  empresa: 'Empresa Exemplo',
  whatsapp: '(11) 99999-9999',
  segmento: 'Corporativo',
  quantidade: '50 a 100 unidades',
  descricao: 'Caixas para um evento.',
  pageUrl: 'https://missmilu.com.br/?gclid=Cj0KCQteste123',
};

const atribuicao = {
  primeiro: { pagina: 'https://missmilu.com.br/?gclid=Cj0KCQteste123', veioDe: 'https://www.google.com/', quando: new Date().toISOString() },
  ultimo: { pagina: 'https://missmilu.com.br/?gclid=Cj0KCQteste123', veioDe: 'https://www.google.com/', quando: new Date().toISOString() },
  referrerDaPagina: 'https://www.google.com/',
};

function respostaFalsa(status) {
  return new Response(JSON.stringify({ ok: status < 300 }), { status });
}

test('sem o segredo configurado, não envia nada', async () => {
  let chamadas = 0;
  const r = await enviarLeadPara2p(lead, atribuicao, {}, async () => { chamadas++; return respostaFalsa(202); });
  assert.deepEqual(r, { enviado: false, motivo: 'nao_configurado' });
  assert.equal(chamadas, 0);
});

test('envia assinado (HMAC), com a fonte da Miss Milú e o mesmo ID como chave de idempotência', async () => {
  let pedido;
  const r = await enviarLeadPara2p(lead, atribuicao, { LEAD_2P_SECRET: SEGREDO }, async (url, init) => {
    pedido = { url, init };
    return respostaFalsa(202);
  });
  assert.equal(r.enviado, true);
  assert.equal(pedido.url, 'https://api.stg.doispalitosmkt.com.br/v1/leads');
  const h = pedido.init.headers;
  assert.equal(h['X-2P-Source'], 'lp-miss-milu');
  const esperado = 'v1=' + createHmac('sha256', SEGREDO).update(h['X-2P-Timestamp'] + '.' + pedido.init.body).digest('hex');
  assert.equal(h['X-2P-Signature'], esperado);
  const corpo = JSON.parse(pedido.init.body);
  assert.equal(h['Idempotency-Key'], corpo.submission_id);
  assert.equal(corpo.schema_version, 1);
  assert.equal(corpo.attribution.first_touch.referrer, 'https://www.google.com/');
  assert.equal(corpo.test, undefined);
});

test('repete em erro do servidor com o MESMO ID; não repete erro de dado', async () => {
  const ids = [];
  const status = [503, 502, 202];
  const r = await enviarLeadPara2p(lead, atribuicao, { LEAD_2P_SECRET: SEGREDO }, async (_url, init) => {
    ids.push(init.headers['Idempotency-Key']);
    return respostaFalsa(status.shift());
  }, { pausaMs: 0 });
  assert.equal(r.enviado, true);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 1);

  let tentativas = 0;
  const r2 = await enviarLeadPara2p(lead, atribuicao, { LEAD_2P_SECRET: SEGREDO }, async () => { tentativas++; return respostaFalsa(400); }, { pausaMs: 0 });
  assert.equal(r2.enviado, false);
  assert.equal(tentativas, 1);
});

test('queda de rede nunca vira erro para o formulário', async () => {
  const r = await enviarLeadPara2p(lead, atribuicao, { LEAD_2P_SECRET: SEGREDO }, async () => { throw new TypeError('fetch failed'); }, { pausaMs: 0 });
  assert.deepEqual(r, { enviado: false, motivo: 'rede' });
});

test('nome com [TESTE] marca o lead como teste; atribuição estranha do navegador é ignorada', () => {
  const p = montarLead2p({ ...lead, nome: '[TESTE] Maria' }, { primeiro: { pagina: 42, quando: 'ontem' }, ultimo: 'x' });
  assert.equal(p.test, true);
  assert.equal(p.attribution.first_touch, null);
  assert.equal(p.attribution.last_touch, null);
});

test('o formulário continua indo ao RD e, em paralelo, ao CRM 2P', async () => {
  const destinos = [];
  const promessas = [];
  const fetchMock = async (input, init) => {
    const url = new URL(input);
    destinos.push(url.host);
    if (url.host.includes('doispalitosmkt')) return respostaFalsa(202);
    if (url.pathname.endsWith('/organizations') && init.method === 'GET') return new Response(JSON.stringify({ organizations: [] }), { status: 200 });
    if (url.pathname.endsWith('/organizations')) return new Response(JSON.stringify({ _id: 'org-1' }), { status: 200 });
    if (url.pathname.endsWith('/deals')) return new Response(JSON.stringify({ _id: 'deal-1', user: { _id: 'user-1' } }), { status: 200 });
    return new Response(JSON.stringify({ _id: 'x' }), { status: 200 });
  };
  const request = new Request('https://missmilu.com.br/api/rd-crm-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://missmilu.com.br' },
    body: JSON.stringify({ ...lead, atribuicao }),
  });
  const response = await handleLeadRequest(request, { RD_CRM_TOKEN: 't', LEAD_2P_SECRET: SEGREDO }, fetchMock, (p) => promessas.push(p));
  assert.equal(response.status, 201);
  assert.equal(promessas.length, 1);
  assert.equal((await promessas[0]).enviado, true);
  assert.ok(destinos.includes('crm.rdstation.com'));
  assert.ok(destinos.includes('api.stg.doispalitosmkt.com.br'));
});

test('CRM 2P fora do ar não afeta a resposta do formulário', async () => {
  const promessas = [];
  const fetchMock = async (input, init) => {
    const url = new URL(input);
    if (url.host.includes('doispalitosmkt')) throw new TypeError('fetch failed');
    if (url.pathname.endsWith('/organizations') && init.method === 'GET') return new Response(JSON.stringify({ organizations: [] }), { status: 200 });
    if (url.pathname.endsWith('/deals')) return new Response(JSON.stringify({ _id: 'deal-1', user: { _id: 'user-1' } }), { status: 200 });
    return new Response(JSON.stringify({ _id: 'x' }), { status: 200 });
  };
  const request = new Request('https://missmilu.com.br/api/rd-crm-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://missmilu.com.br' },
    body: JSON.stringify(lead),
  });
  const response = await handleLeadRequest(request, { RD_CRM_TOKEN: 't', LEAD_2P_SECRET: SEGREDO, LEAD_2P_URL: 'https://api.stg.doispalitosmkt.com.br/v1/leads' }, fetchMock, (p) => promessas.push(p));
  assert.equal(response.status, 201);
  // a promessa paralela termina sozinha (com as novas tentativas); não precisa esperar aqui
});

test('honeypot (robô) não vai para nenhum CRM', async () => {
  const promessas = [];
  let chamadas = 0;
  const request = new Request('https://missmilu.com.br/api/rd-crm-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://missmilu.com.br' },
    body: JSON.stringify({ ...lead, website: 'https://spam.example' }),
  });
  const response = await handleLeadRequest(request, { RD_CRM_TOKEN: 't', LEAD_2P_SECRET: SEGREDO }, async () => { chamadas++; return respostaFalsa(200); }, (p) => promessas.push(p));
  assert.equal(response.status, 200);
  assert.equal(chamadas, 0);
  assert.equal(promessas.length, 0);
});
