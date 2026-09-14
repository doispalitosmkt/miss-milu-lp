const CRM_API_BASE = 'https://crm.rdstation.com/api/v1';

class CrmRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'CrmRequestError';
    this.status = status;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits.length === 10 || digits.length === 11 ? digits : '';
}

function comparable(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function crmRequest(path, token, options = {}, fetchImpl = fetch) {
  const url = new URL(CRM_API_BASE + path);
  url.searchParams.set('token', token);

  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const requestOptions = {
    method: options.method || 'GET',
    headers: { Accept: 'application/json' },
  };

  if (options.body) {
    requestOptions.headers['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetchImpl(url.toString(), requestOptions);
  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new CrmRequestError(response.status, 'RD Station CRM request failed');
  }

  return data;
}

async function findOrganization(name, token, fetchImpl) {
  const data = await crmRequest('/organizations', token, {
    query: { q: name, limit: 20 },
  }, fetchImpl);
  const organizations = Array.isArray(data.organizations) ? data.organizations : [];
  return organizations.find((organization) => comparable(organization.name || '') === comparable(name)) || null;
}

async function getOrCreateOrganization(lead, token, fetchImpl) {
  try {
    const existing = await findOrganization(lead.empresa, token, fetchImpl);
    if (existing) return existing;

    return await crmRequest('/organizations', token, {
      method: 'POST',
      body: {
        organization: {
          name: lead.empresa,
          organization_segments: [lead.segmento],
          resume: cleanText(
            'Empresa cadastrada automaticamente pelo formulário de orçamento da landing page Miss Milú.' +
              (lead.descricao ? ' Projeto informado: ' + lead.descricao : ''),
            1000,
          ),
        },
      },
    }, fetchImpl);
  } catch (error) {
    if (error instanceof CrmRequestError && (error.status === 401 || error.status === 403)) {
      throw error;
    }

    try {
      return await findOrganization(lead.empresa, token, fetchImpl);
    } catch (retryError) {
      if (retryError instanceof CrmRequestError && (retryError.status === 401 || retryError.status === 403)) {
        throw retryError;
      }
      return null;
    }
  }
}

function buildNote(lead) {
  const lines = [
    'Lead recebido pelo formulário da landing page Miss Milú.',
    '',
    'Nome: ' + lead.nome,
    'Empresa: ' + lead.empresa,
    'WhatsApp: ' + lead.whatsapp,
    'Segmento: ' + lead.segmento,
    'Quantidade estimada: ' + lead.quantidade,
    'Sobre o projeto: ' + (lead.descricao || 'Não informado'),
    'Página de origem: ' + (lead.pageUrl || 'Não informada'),
  ];

  const utm = [
    lead.utmSource && 'utm_source=' + lead.utmSource,
    lead.utmMedium && 'utm_medium=' + lead.utmMedium,
    lead.utmCampaign && 'utm_campaign=' + lead.utmCampaign,
    lead.utmTerm && 'utm_term=' + lead.utmTerm,
  ].filter(Boolean);

  if (utm.length) lines.push('Campanha: ' + utm.join(' | '));
  return lines.join('\n');
}

export async function createLeadInCrm(lead, token, fetchImpl = fetch) {
  const organization = await getOrCreateOrganization(lead, token, fetchImpl);
  const dealName = cleanText(
    'Orçamento site | ' + lead.empresa + ' | ' + lead.segmento + ' | ' + lead.quantidade,
    200,
  );
  const dealPayload = {
    deal: { name: dealName },
    contacts: [
      {
        name: lead.nome,
        phones: [{ phone: lead.phoneDigits, type: 'cellphone' }],
        legal_bases: [
          { category: 'data_processing', type: 'consent', status: 'granted' },
          { category: 'communications', type: 'consent', status: 'granted' },
        ],
      },
    ],
  };

  const organizationId = organization && (organization._id || organization.id);
  if (organizationId) dealPayload.organization = { _id: organizationId };

  const deal = await crmRequest('/deals', token, {
    method: 'POST',
    body: dealPayload,
  }, fetchImpl);
  const dealId = deal._id || deal.id;
  const userId = deal.user && (deal.user._id || deal.user.id);
  let noteSaved = false;

  if (dealId && userId) {
    try {
      await crmRequest('/activities', token, {
        method: 'POST',
        body: {
          activity: {
            deal_id: dealId,
            user_id: userId,
            text: buildNote(lead),
          },
        },
      }, fetchImpl);
      noteSaved = true;
    } catch (error) {
      console.error('RD Station CRM annotation failed with status', error.status || 'unknown');
    }
  }

  return { dealId, noteSaved };
}

export async function handleLeadRequest(request, env, fetchImpl = fetch) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Método não permitido.' }, 405);
  }

  if (!sameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'Origem não permitida.' }, 403);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse({ ok: false, error: 'Formato inválido.' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Dados inválidos.' }, 400);
  }

  if (cleanText(body.website, 200)) {
    return jsonResponse({ ok: true }, 200);
  }

  const lead = {
    nome: cleanText(body.nome, 120),
    empresa: cleanText(body.empresa, 160),
    whatsapp: cleanText(body.whatsapp, 40),
    segmento: cleanText(body.segmento, 120),
    quantidade: cleanText(body.quantidade, 80),
    descricao: cleanText(body.descricao, 3000),
    pageUrl: cleanText(body.pageUrl, 500),
    utmSource: cleanText(body.utmSource, 200),
    utmMedium: cleanText(body.utmMedium, 200),
    utmCampaign: cleanText(body.utmCampaign, 200),
    utmTerm: cleanText(body.utmTerm, 200),
    phoneDigits: normalizePhone(body.whatsapp),
  };

  if (!lead.nome || !lead.empresa || !lead.phoneDigits || !lead.segmento || !lead.quantidade) {
    return jsonResponse({ ok: false, error: 'Preencha corretamente os campos obrigatórios.' }, 400);
  }

  const token = env && env.RD_CRM_TOKEN;
  if (!token) {
    return jsonResponse({ ok: false, error: 'Integração com o CRM indisponível.' }, 503);
  }

  try {
    const result = await createLeadInCrm(lead, token, fetchImpl);
    return jsonResponse({ ok: true, noteSaved: result.noteSaved }, 201);
  } catch (error) {
    console.error('RD Station CRM lead creation failed with status', error.status || 'unknown');
    return jsonResponse({ ok: false, error: 'Não foi possível registrar o contato no CRM.' }, 502);
  }
}

export async function onRequest(context) {
  return handleLeadRequest(context.request, context.env);
}
