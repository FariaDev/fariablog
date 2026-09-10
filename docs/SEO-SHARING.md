# SEO e compartilhamento

O HTML entregue pelo Hugo contém todos os metadados, sem depender de JavaScript. A marca é a mesma do site: janela entreaberta, papel claro, moldura vinho e cenas da biblioteca.

## Conteúdo que controla a prévia

| Campo | Uso |
| --- | --- |
| `title` | Título visível; padrão para busca e compartilhamento. |
| `seoTitle` | Opcional: substitui o título nos metadados, preservando o título do artigo. |
| `description` | Resumo conciso para a descrição HTML, Open Graph, Twitter Card e JSON-LD. |
| `summary` | Resumo editorial para listagens e feeds. Nos artigos atuais acompanha `description`. |
| `author` | Autor do artigo. `Lucas` é normalizado para `Lucas Faria` nos metadados. |
| `translationKey` | Liga os artigos traduzidos para os alternates de idioma. |
| `cover` | Continua disponível para imagens editoriais; não substitui automaticamente o cartão da casa. |

Preencha descrições específicas, em vez de repetir o nome do site ou palavras-chave. O título nos resultados pode ser reescrito pelo buscador; os metadados expressam nossa preferência, não garantem o texto mostrado.

As páginas principais têm descrições PT/EN próprias. Assuntos recebem uma descrição contextual. Busca e a antiga rota de contato usam `noindex, follow` em produção e ficam fora do sitemap. Contato aponta canonicamente para Sobre. Ambientes de desenvolvimento continuam com `noindex, nofollow`.

## Banners automáticos

`seo-metadata.html` centraliza título, descrição, autor, canonical e imagem. `social-image.html` compõe um JPEG de **1200 × 630 px** por cômodo, com apenas “Faria Blog”, a logo e a cena apropriada. O mesmo banner serve aos dois idiomas:

- Início: escrivaninha;
- Sobre: vista superior da mesa;
- Livros: estante;
- Textos, artigos e páginas auxiliares: janela de leitura.

Títulos de páginas, descrições, categorias e assinatura do autor não são impressos na imagem; continuam nos metadados do link. O cartão é publicado em `/processed-images/` com SHA-256 no nome: alterações visuais geram uma URL nova. A página informa formato, dimensões reais e texto alternativo. Open Graph e Twitter Card usam a mesma imagem; o corpo da página não baixa esses banners.

A moldura é mantida em `assets/brand/social-base.svg`. Para regenerar seu PNG após editá-la:

```bash
npm ci
node scripts/build-social-base.mjs
```

Libre Caslon Text é distribuída com licença OFL em `assets/fonts/`; a fonte serve ao build e não é carregada no navegador. Para atualizar o banner do README e os antigos endereços públicos da marca:

```bash
bash scripts/update-readme-banner.sh
```

## Dados estruturados e ícones

As páginas iniciais identificam `WebSite` e `Person`. Ensaios usam `BlogPosting`, autor com URL, datas, imagem e breadcrumbs. Sobre usa `ProfilePage`; listas usam `CollectionPage`. Os valores vêm das mesmas informações usadas pelo head.

O favicon simplificado é servido em SVG, ICO e PNG 32/48 px. A assinatura detalhada e o ícone Apple permanecem separados. Os arquivos devem continuar acessíveis aos crawlers.

## Validação

```bash
bash scripts/verify.sh
```

O gate verifica descrições consistentes entre HTML/OG/Twitter, URL canonical, cards JPEG existentes com 1200 × 630 e menos de 300 KB, dimensões declaradas, texto alternativo, schema do autor, páginas fora do sitemap e os quatro cômodos. Não envia posts nem mensagens a plataformas externas.

Após publicar, confira o link do Início, de um artigo e de uma página em PT/EN. Ferramentas como o [Post Inspector do LinkedIn](https://www.linkedin.com/post-inspector/) e o [Sharing Debugger da Meta](https://developers.facebook.com/tools/debug/) ajudam a consultar uma nova captura. Uma plataforma pode manter uma prévia antiga em cache ou escolher seu próprio recorte; o aspecto final não é idêntico em todos os clientes.

## Referências

- [Open Graph: propriedades de imagens e metadados](https://ogp.me/).
- [LinkedIn: campos e requisitos de imagem para compartilhamento](https://www.linkedin.com/help/linkedin/answer/a521928).
- [Google: nome do site e WebSite](https://developers.google.com/search/docs/appearance/site-names).
- [Google: dados estruturados de artigos](https://developers.google.com/search/docs/appearance/structured-data/article).
- [Google: favicon nos resultados de busca](https://developers.google.com/search/docs/appearance/favicon-in-search).
