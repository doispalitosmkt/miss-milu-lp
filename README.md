# Miss Milú — Landing Page

Landing page da Miss Milú (caixas rígidas personalizadas), focada em conversão de leads corporativos via Google Ads.

## Estrutura

```
miss-milu-lp/
└── lp/                      # a landing page publicada
    ├── index.html
    ├── style.css
    ├── script.js
    ├── .htaccess            # legado (Apache/Hostinger), ignorado por GitHub/Cloudflare Pages
    ├── _headers             # cabeçalhos de cache/segurança para o Cloudflare Pages
    ├── CNAME                # domínio customizado do GitHub Pages
    └── assets/              # imagens, logos e portfólio (WebP)
```

## Deploy

HTML/CSS/JS puro, sem build. A pasta publicada é `lp/`.

**Cloudflare Pages**: o projeto Direct Upload `miss-milu-lp` publica a pasta
`lp/` pelo workflow
[`cloudflare-pages.yml`](.github/workflows/cloudflare-pages.yml) a cada push em
`main` que altere a landing page. URL atual:
https://miss-milu-lp-7q8.pages.dev/.

O repositório precisa ter estes Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` com a permissão **Account > Cloudflare Pages > Edit**

Como o projeto é estático, não há comando de build nem variáveis de ambiente da
aplicação. A configuração equivalente para um projeto com integração Git seria:

| Campo | Valor |
|---|---|
| Build command | *(vazio)* |
| Build output directory | `lp` |
| Root directory | *(vazio; raiz do repositório)* |

**GitHub Pages** (mantido em paralelo): publicada via workflow em
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) a partir da pasta
`lp/`: https://doispalitosmkt.github.io/miss-milu-lp/

## Portfólio

O catálogo estático do portfólio é gerado por `lp/assets/portfolio/catalogo.php`.
Depois de adicionar ou remover fotos em `lp/assets/portfolio/carrossel/`, rode
dentro de `lp/`:

```bash
php assets/portfolio/catalogo.php --write
```

Guia completo em [`lp/assets/portfolio/carrossel/README.md`](lp/assets/portfolio/carrossel/README.md).
