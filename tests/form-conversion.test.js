import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = readFileSync(new URL('../lp/script.js', import.meta.url), 'utf8');
const start = script.indexOf('/* === FORMULARIO:');
const end = script.indexOf('/* === CAROUSEL:', start);
assert.ok(start >= 0 && end > start, 'O código do formulário deve estar presente');
const formScript = script.slice(start, end);

async function submitWithStatus(status) {
  const fields = {
    nome: { value: 'Maria da Silva' },
    email: { value: 'maria@exemplo.com' },
    empresa: { value: 'Empresa Exemplo' },
    whatsapp: { value: '(11) 99999-9999' },
    segmento: { value: 'Corporativo' },
    quantidade: { value: '50 a 100 unidades' },
    descricao: { value: '' },
    website: { value: status === 200 ? 'https://spam.example' : '' },
  };
  const submitButton = {
    disabled: false,
    setAttribute() {},
    removeAttribute() {},
  };
  let submit;
  let resets = 0;
  const form = {
    addEventListener(event, callback) {
      assert.equal(event, 'submit');
      submit = callback;
    },
    querySelector() { return submitButton; },
    reset() { resets += 1; },
  };
  const window = {
    location: { search: '', href: 'https://missmilu.com.br/' },
    dataLayer: [],
    open() {},
  };

  vm.runInNewContext(formScript, {
    document: { getElementById: (id) => id === 'orcamento-form' ? form : fields[id] },
    window,
    fetch: async () => ({ ok: status >= 200 && status < 300, status }),
    URLSearchParams,
    encodeURIComponent,
    console,
    alert() { throw new Error('Formulário de teste inválido'); },
  });

  submit({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  return { events: window.dataLayer.map((item) => item.event), resets };
}

test('confirma conversão somente após criação real do lead no CRM', async () => {
  assert.deepEqual(await submitWithStatus(201), { events: ['generate_lead'], resets: 1 });
});

test('honeypot não dispara conversão nem limpa o formulário', async () => {
  assert.deepEqual(await submitWithStatus(200), { events: [], resets: 0 });
});
