# Interface editorial do FariaBlog

A apresentação principal do FariaBlog segue a direção de [darioamodei.com](https://darioamodei.com/): conteúdo em primeiro lugar, tipografia serifada, fundo quente, uma única coluna e listas diretas.

## Desenvolvimento

```bash
hugo server -D
./scripts/verify.sh
```

O servidor local abre em `http://localhost:1313/pt-br/`.

## Regras visuais

A base visual usa uma coluna de `42rem`, Georgia com fallback serifado, fundo marfim no tema claro e contraste suave no escuro. O cabeçalho contém apenas a identidade e o controle de tema; a navegação completa fica no rodapé.

As extensões restantes são funcionais: imagens responsivas, rolagem de código e tabelas, divisões claras entre células, foco de teclado, tema manual e impressão.

## Organização

- `layouts/_default/index.html`: home, publicações, busca e assuntos;
- `layouts/posts/single.html`: artigos completos;
- `layouts/_default/`: busca, listas, taxonomias e páginas auxiliares;
- `layouts/partials/site-header.html`: identidade do site e controle de tema;
- `layouts/partials/publication-entry.html`: representação simples de um texto;
- `assets/css/site.css`: toda a apresentação;
- `assets/js/search.js`: busca local, carregada apenas na rota de busca;
- `assets/js/article.js`: cópia e âncoras, carregado apenas nos artigos;
- `scripts/verify.py`: contratos de HTML, SEO, links, imagens e cache.

## Princípios

- fonte serifada local, sem webfont;
- links e controles reconhecíveis como links e controles;
- nenhum card, sombra, moldura ou animação decorativa;
- JavaScript somente como melhoria progressiva;
- nenhuma fonte remota, ferramenta de analytics ou script de terceiros;
- imagens mantidas quando fazem parte do conteúdo; originais estáveis usam `/images/` e variantes responsivas fingerprintadas usam `/processed-images/`;
- busca Fuse carregada apenas na rota de busca;
- versão impressa sem navegação nem elementos interativos.
