# Fotos das galerias do portfólio

Esta é a fonte única das imagens exibidas na seção **Portfólio** e no carrossel
do hero. Cada segmento possui uma pasta própria:

1. `01-corporativo`
2. `02-arquitetos`
3. `03-confeitaria`
4. `04-cestas-e-cafe`
5. `05-fotografos`
6. `06-padrinhos`
7. `07-velas-e-saboaria`
8. `08-casinhas`
9. `09-datas-sazonais`

## Funcionamento do catálogo

O arquivo `assets/portfolio/catalogo.php` varre essas nove pastas localmente e
gera `assets/portfolio/catalogo.js`, que é carregado pela página. A quantidade
de fotos não fica escrita no HTML ou no JavaScript principal.

O hero usa o mesmo catálogo e sorteia no máximo cinco imagens distintas de todo
o portfólio a cada visita. A antiga pasta `assets/hero-carrossel` não alimenta
mais o site.

## Como adicionar ou substituir

1. Coloque a imagem diretamente na pasta do segmento correto.
2. Use WebP, JPG, JPEG ou PNG.
3. Para controlar a ordem, prefira nomes como `01.webp`, `02.webp`, `03.webp`.
4. Não é necessário manter uma quantidade fixa e não há problema em ultrapassar
   seis fotos.
5. Gere novamente o catálogo com o comando abaixo e recarregue a página. O
   catálogo altera a versão da URL quando o conteúdo de um arquivo muda,
   evitando imagens antigas no cache.

As imagens precisam ter o assunto principal próximo ao centro. A galeria e o
hero usam enquadramentos diferentes e aplicam `object-fit: cover`, portanto as
bordas podem sofrer um pequeno recorte.

## Atualização do catálogo estático

O site publicado é totalmente estático e não executa PHP. Depois de alterar as
fotos, atualize o catálogo antes de publicar:

```bash
php assets/portfolio/catalogo.php --write
```

Para apenas conferir se o catálogo está sincronizado:

```bash
php assets/portfolio/catalogo.php --check
```
