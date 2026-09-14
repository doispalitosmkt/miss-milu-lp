import assert from 'node:assert/strict';
import test from 'node:test';

import { handleLeadRequest } from '../functions/api/rd-crm-lead.js';

function makeRequest(body, options = {}) {
  return new Request('https://lp.missmilu.com.br/api/rd-crm-lead', {
    method: options.method || 'POST',
    headers: {
      'Content-Type': options.contentType || 'application/json',
      Origin: options.origin || 'https://lp.missmilu.com.br',
    },
    body: options.method === 'GET' ? undefined : JSON.stringify(body),
  });
}

const validLead = {
  nome: 'Maria da Silva',
  empresa: 'Empresa Exemplo',
  whatsapp: '(11) 99999-9999',
  segmento: 'Corporativo',
  quantidade: '50 a 100 unidades',
  descricao: 'Caixas para um evento.',
  pageUrl: 'https://lp.missmilu.com.br/?utm_source=google',
  utmSource: 'google',
};

test('rejeita métodos diferentes de POST', async () => {
  const response = await handleLeadRequest(makeRequest({}, { method: 'GET' }), {});
  assert.equal(response.status, 405);
});

test('rejeita requisições de outra origem', async () => {
  const request = makeRequest(validLead, { origin: 'https://example.com' });
  const response = await handleLeadRequest(request, { RD_CRM_TOKEN: 'test-token' });
  assert.equal(response.status, 403);
});

test('rejeita telefone brasileiro inválido', async () => {
  const response = await handleLeadRequest(
    makeRequest({ ...validLead, whatsapp: '123' }),
    { RD_CRM_TOKEN: 'test-token' },
  );
  assert.equal(response.status, 400);
});

test('informa quando o segredo do CRM não está configurado', async () => {
  const response = await handleLeadRequest(makeRequest(validLead), {});
  assert.equal(response.status, 503);
});

test('ignora silenciosamente o honeypot de robôs', async () => {
  let requested = false;
  const response = await handleLeadRequest(
    makeRequest({ ...validLead, website: 'https://spam.example' }),
    { RD_CRM_TOKEN: 'test-token' },
    async () => {
      requested = true;
      return new Response('{}');
    },
  );
  assert.equal(response.status, 200);
  assert.equal(requested, false);
});

test('cria empresa, negociação, contato e anotação no RD CRM', async () => {
  const calls = [];
  const fetchMock = async (input, init) => {
    const url = new URL(input);
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });

    if (url.pathname.endsWith('/organizations') && init.method === 'GET') {
      return new Response(JSON.stringify({ organizations: [] }), { status: 200 });
    }
    if (url.pathname.endsWith('/organizations') && init.method === 'POST') {
      return new Response(JSON.stringify({ _id: 'organization-1' }), { status: 200 });
    }
    if (url.pathname.endsWith('/deals')) {
      return new Response(JSON.stringify({ _id: 'deal-1', user: { _id: 'user-1' } }), { status: 200 });
    }
    if (url.pathname.endsWith('/activities')) {
      return new Response(JSON.stringify({ _id: 'activity-1' }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };

  const response = await handleLeadRequest(
    makeRequest(validLead),
    { RD_CRM_TOKEN: 'test-token' },
    fetchMock,
  );
  assert.equal(response.status, 201);
  assert.equal(calls.length, 4);
  assert.equal(calls.every((call) => call.url.searchParams.get('token') === 'test-token'), true);

  const organizationCall = calls[1];
  assert.equal(organizationCall.body.organization.name, 'Empresa Exemplo');
  assert.deepEqual(organizationCall.body.organization.organization_segments, ['Corporativo']);

  const dealCall = calls[2];
  assert.equal(dealCall.body.organization._id, 'organization-1');
  assert.equal(dealCall.body.contacts[0].name, 'Maria da Silva');
  assert.equal(dealCall.body.contacts[0].phones[0].phone, '11999999999');

  const activityCall = calls[3];
  assert.equal(activityCall.body.activity.deal_id, 'deal-1');
  assert.match(activityCall.body.activity.text, /50 a 100 unidades/);
  assert.match(activityCall.body.activity.text, /utm_source=google/);
});
