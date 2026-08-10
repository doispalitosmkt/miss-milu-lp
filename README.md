# Miss Milú — Landing Page

Landing page da Miss Milú (caixas rígidas personalizadas), focada em conversão de leads corporativos via Google Ads.

## Estrutura

```
miss-milu-lp/
└── lp/                      # a landing page publicada
    ├── index.html
    ├── style.css
    ├── script.js
    ├── .htaccess
    └── assets/              # imagens, logos e portfólio (WebP)
```

## Deploy

A `lp/` é publicada em `doispalitosmkt.com.br/miss-milu-lp/` (servidor Hostinger).
Editar em `lp/` e enviar via SSH.

## Portfólio

O catálogo do portfólio é gerado dinamicamente por `lp/assets/portfolio/catalogo.php`.
Adicionar ou remover fotos em `lp/assets/portfolio/carrossel/` atualiza as galerias
automaticamente. Para gerar o fallback estático (usado quando não há suporte a PHP),
rode dentro de `lp/`:

```bash
php assets/portfolio/catalogo.php --write
```

Guia completo em [`lp/assets/portfolio/carrossel/README.md`](lp/assets/portfolio/carrossel/README.md).
