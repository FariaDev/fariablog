# Interface mínima do FariaBlog

A apresentação principal do FariaBlog segue diretamente os padrões de [bestmotherfucking.website](https://bestmotherfucking.website/): conteúdo em primeiro lugar, tipografia do sistema, uma única coluna e quase nenhum estilo além do necessário para leitura.

## Desenvolvimento

```bash
hugo server -D
./scripts/verify.sh
```

O servidor local abre em `http://localhost:1313/pt-br/`.

## Regras visuais

A base cabe em poucas declarações:

```css
body {
  margin: 1em auto;
  max-width: 40em;
  padding: 0 .62em 3.24em;
  font: 1.2em/1.62 sans-serif;
}

h1, h2, h3 {
  line-height: 1.2;
}
```

As únicas extensões relevantes são funcionais: imagens responsivas, rolagem de código e tabelas, divisões claras entre células, foco de teclado, tema manual e impressão.

## Organização

- `layouts/_default/index.html`: home, publicações, busca e assuntos;
- `layouts/posts/single.html`: artigos completos;
- `layouts/_default/`: busca, listas, taxonomias e páginas auxiliares;
- `layouts/partials/site-header.html`: navegação textual e tema;
- `layouts/partials/publication-entry.html`: representação simples de um texto;
- `assets/css/site.css`: toda a apresentação;
- `assets/js/search.js`: busca local, carregada apenas na rota de busca;
- `assets/js/article.js`: cópia e âncoras, carregado apenas nos artigos;
- `scripts/verify.py`: contratos de HTML, SEO, links, imagens e cache.

## Princípios

- fonte do sistema, sem webfont;
- links e controles reconhecíveis como links e controles;
- nenhum card, sombra, moldura ou animação decorativa;
- JavaScript somente como melhoria progressiva;
- nenhuma fonte remota, ferramenta de analytics ou script de terceiros;
- imagens mantidas quando fazem parte do conteúdo; originais estáveis usam `/images/` e variantes responsivas fingerprintadas usam `/processed-images/`;
- busca Fuse carregada apenas na rota de busca;
- versão impressa sem navegação nem elementos interativos.
