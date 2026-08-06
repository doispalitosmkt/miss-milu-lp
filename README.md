# Miss Milú — Nova Landing Page

Repositório de documentação para a criação da landing page da Miss Milú, focada em conversão de leads corporativos via Google Ads.

---

## Estrutura

```
Nova LP/                    # repositório git (org doispalitosmkt, privado)
├── lp/                     # ENTREGÁVEL: a landing page publicada
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── .htaccess
│   └── assets/             # imagens locais (logos, portfólio em WebP, foto)
│
├── docs/                   # documentação e inteligência de negócio
│   ├── design-system/      # tokens, atoms, molecules, organisms, pages
│   └── negocio/            # empresa, fundadora, produtos, mercados, etc.
│
├── .gitignore
└── README.md

_fonte/  (fora do git — mantido só localmente)
├── portfolio-2026/         # 66MB de fotos extraídas do PDF (edição da galeria pendente)
├── auditoria/              # screenshots de auditoria visual
├── prints/                 # capturas da versão publicada
├── _arquivo/               # versões antigas arquivadas
└── roteiro-video/          # Roteiro_Video_Luciana_Miss_Milu.docx/pdf
```

`_fonte/` guarda material pesado e de trabalho (fotos-fonte, auditorias, backups).
Fica fora do git de propósito — é usado para editar a galeria e ajustar as cores da LP.

Deploy: a `lp/` é publicada em `doispalitosmkt.com.br/miss-milu-lp/`
(servidor Hostinger da 2P). Editar em `lp/` e enviar via SSH.

---

## Quick Reference para criação da LP

### Marca

| Elemento | Valor |
|---|---|
| Cor primária | `#EF5F5F` (coral) |
| Cor botão | `#F26666` |
| Cor footer | `#F7A99D` (salmão) |
| Texto | `#545454` |
| Fonte títulos | Bookman Old Style (serif) |
| Fonte corpo | Open Sans |
| Container | 1170px |
| Arquivo de tokens | [`design-system/tokens.css`](docs/design-system/tokens.css) |

### Proposta de valor

> **"Caixas que Falam"** — embalagem premium que amplifica o valor do seu produto e a percepção da sua marca.

### Persona-alvo da LP

**"TMC" (corporativo)** — Gerente/Analista de Marketing, RH ou Compras em empresa de médio/grande porte, que precisa presentear com qualidade e quer um fornecedor confiável que apareça no Google.

### Palavras-chave prioritárias

```
caixas rígidas personalizadas São Paulo
caixas cartonadas personalizadas
embalagens personalizadas corporativas
press kit personalizado SP
gift corporativo personalizado
```

### Produto foco da LP

**Caixa rígida cartonada** — R$45-56/un, mínimo 30 unidades, ticket R$2.500-3.000, maior margem.

### Contato e conversão

- WhatsApp: **(11) 98162-8872**
- Fluxo: Google Ad → LP → formulário de orçamento → WhatsApp < 24h

---

## Documentos de Design System

| Arquivo | O que tem |
|---|---|
| [`design-system/README.md`](docs/design-system/README.md) | Visão geral da plataforma e stack |
| [`design-system/tokens.css`](docs/design-system/tokens.css) | Todas as variáveis CSS |
| [`design-system/01-atoms/colors.md`](docs/design-system/01-atoms/colors.md) | Paleta completa com uso de cada cor |
| [`design-system/01-atoms/typography.md`](docs/design-system/01-atoms/typography.md) | H1-H6, corpo, nav — tamanhos e pesos |
| [`design-system/01-atoms/spacing.md`](docs/design-system/01-atoms/spacing.md) | Grid, breakpoints, escala de espaçamentos |
| [`design-system/01-atoms/borders.md`](docs/design-system/01-atoms/borders.md) | Radius, sombras |
| [`design-system/01-atoms/icons.md`](docs/design-system/01-atoms/icons.md) | Ícones Entypo/Fontello, botão WhatsApp |
| [`design-system/02-molecules/buttons.md`](docs/design-system/02-molecules/buttons.md) | Botão primário + recomendação para LP |
| [`design-system/02-molecules/cards.md`](docs/design-system/02-molecules/cards.md) | Cards de produto, categoria, masonry |
| [`design-system/02-molecules/navigation.md`](docs/design-system/02-molecules/navigation.md) | Topbar, header, nav completo, dropdown |
| [`design-system/02-molecules/forms.md`](docs/design-system/02-molecules/forms.md) | Input de busca, formulário de contato |
| [`design-system/03-organisms/header.md`](docs/design-system/03-organisms/header.md) | Estrutura completa do header |
| [`design-system/03-organisms/footer.md`](docs/design-system/03-organisms/footer.md) | Footer 3 colunas, contato, endereço |
| [`design-system/03-organisms/hero.md`](docs/design-system/03-organisms/hero.md) | Opções de hero para a LP |
| [`design-system/03-organisms/cta-banner.md`](docs/design-system/03-organisms/cta-banner.md) | Banners CTA (2 variações) |
| [`design-system/03-organisms/product-grid.md`](docs/design-system/03-organisms/product-grid.md) | Grid de produtos 4 colunas |
| [`design-system/03-organisms/masonry.md`](docs/design-system/03-organisms/masonry.md) | Galeria masonry horizontal e vertical |
| [`design-system/04-pages/homepage.md`](docs/design-system/04-pages/homepage.md) | Mapa de todas as 12 seções da homepage |

---

## Documentos de Negócio

| Arquivo | O que tem |
|---|---|
| [`negocio/empresa.md`](docs/negocio/empresa.md) | CNPJ, razão social, endereço, equipe completa |
| [`negocio/fundadora.md`](docs/negocio/fundadora.md) | História da Luciana — jornalista → empreendedora |
| [`negocio/produtos.md`](docs/negocio/produtos.md) | Catálogo com preços, margens, mínimos, glossário técnico |
| [`negocio/mercados.md`](docs/negocio/mercados.md) | 8 segmentos: quem são, produtos, ticket, prioridade |
| [`negocio/posicionamento.md`](docs/negocio/posicionamento.md) | Slogan, diferenciais reais, persona TMC, tom de voz |
| [`negocio/concorrentes.md`](docs/negocio/concorrentes.md) | Análise da Caixa Montada, TMC, Papeleta + oportunidades |
| [`negocio/financeiro.md`](docs/negocio/financeiro.md) | Faturamento, metas, margens, sazonalidade |
| [`negocio/processo-pedido.md`](docs/negocio/processo-pedido.md) | Fluxo de 8 etapas, canais, briefing por segmento, fluxo LP |

---

## Seções Recomendadas para a LP (ordem)

```
1. Hero          — headline forte + CTA "Solicitar Orçamento"
2. Prova social  — logos de clientes (Natura, Vivara, etc.)
3. Produto foco  — caixa rígida: o que é, para quem, qual o mínimo
4. Diferenciais  — 3-4 cards com os diferenciais reais
5. Galeria       — fotos das caixas (prova visual)
6. Segmentos     — quem atendemos (corporativo, confeitaria premium...)
7. Processo      — como funciona em 3-4 passos
8. Depoimentos   — clientes satisfeitos
9. FAQ           — dúvidas comuns (mínimo, prazo, valor)
10. CTA Final    — formulário + WhatsApp
11. Footer       — dados de contato + endereço
```
