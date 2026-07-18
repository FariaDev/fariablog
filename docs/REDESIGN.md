# Arquitetura do redesign A1

O redesign A1 é a apresentação principal do FariaBlog. Ele usa a estrutura canônica do Hugo na raiz e lê diretamente o conteúdo de `content/`.

## Desenvolvimento

```bash
hugo server -D
./scripts/verify.sh
```

O servidor local abre em `http://localhost:1313/pt-br/`. O gate gera builds temporários de produção e desenvolvimento; `public/` não é alterado.

## Organização

- `config.toml`: idiomas, taxonomias, SEO, paginação e mounts do Hugo.
- `layouts/posts/single.html`: documento completo de um artigo.
- `layouts/_default/`: home, busca, listas, taxonomias, páginas auxiliares, RSS e JSON.
- `layouts/partials/publication-entry.html`: representação canônica de uma publicação nas listas.
- `layouts/partials/image-resource.html` e `responsive-image.html`: pipeline único de capas e imagens Markdown.
- `assets/css/site.css`: folha contínua, tema noturno, impressão e responsividade.
- `assets/js/site.js`: tema, busca, cópia, comentários consentidos, âncoras e rail de leitura.
- `static/images/`: fonte única das imagens editoriais. Um mount também as expõe ao Hugo Pipes como recursos processáveis.
- `static/fonts/`: STIX Two Text e sua licença.
- `i18n/`: todos os rótulos visíveis e consumidos pelo JavaScript.
- `scripts/verify.py`: contratos de HTML, SEO, links, imagens e cache.

## Rotas

Nos dois idiomas:

- `/`: publicações, formulário de busca e índice por assunto;
- `/posts/.../`: artigos completos;
- `/search/`: busca Fuse sobre posts do idioma atual;
- `/tags/` e `/tags/<termo>/`: índices temáticos;
- `/archives/`: arquivo cronológico;
- `/books/`: bibliografia pessoal;
- `/contact/`: sobre e contato;
- `/404.html`, RSS, sitemap e robots.

## Decisões

- O conteúdo e as imagens possuem uma única fonte de verdade.
- A home apenas encaminha a consulta; a busca interativa existe em uma única página.
- Fuse.js é local e só é carregado na busca.
- CSS e JavaScript são minificados, fingerprintados e publicados com SRI.
- Imagens recebem dimensões, `srcset` WebP e política de carregamento no build.
- Disqus só carrega após ação explícita do leitor.
- O modo noturno respeita preferência do sistema e persistência local; impressão é sempre clara.
- A versão anterior não é mantida como segunda aplicação: está congelada na tag `pre-redesign`.
