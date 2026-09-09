# Uma casa para leitura

Início, Textos, Livros e Sobre são pontos de vista da mesma casa. A navegação tipográfica pertence ao limiar da cena; nos ensaios e na bibliografia, sai da tela quando o leitor entra no papel.

## Desenvolvimento

```bash
hugo server -D
bash scripts/verify.sh
```

## Cenas e tempo

`house-layer.html` gera WebP responsivo e fingerprintado. O script inline no head define `data-hour` antes do primeiro paint. Cada camada só recebe `src` e `srcset` imediatamente se corresponder ao horário local, com prioridade alta. Sem JavaScript, `noscript` mostra meio-dia.

`house.js` aquece as outras variantes depois de `load`, em `requestIdleCallback` (ou timeout de fallback). Economia de dados e conexões 2G dispensam esse aquecimento. Ao mudar o horário, a camada nova é decodificada antes da troca; uma resposta antiga não pode substituir o horário atual. O relógio é revisto a cada minuto e quando a aba retorna.

O mouse atua apenas com pointer fino e hover. O scroll usa dimensões armazenadas, eventos passivos e requestAnimationFrame, com escala entre 1.04 e 1.06. Reduced motion desativa movimento, crossfade e View Transitions, inclusive se a preferência mudar com a página aberta. As transições nomeiam cena e navegação; entre catálogo e ensaio, `essay-transition.js` associa somente o título escolhido a `essay-title`, inclusive no retorno. O script entra inline no head para preparar `pagereveal` antes do snapshot. Os nomes temporários são limpos para restaurações do BFCache; o root não recebe animação própria.

O Sobre usa temporariamente os assets da home com recorte voltado à biblioteca e ampliação. Uma futura imagem própria pode substituir as três chamadas no template. Não há AVIF, partículas, WebGL ou movimento ambiental contínuo; o entardecer recebe apenas uma pequena alteração estática no tom do scrim.

## Leitura

Georgia permanece no corpo, entre 1.08rem e 1.22rem. Ensaios têm coluna de 43rem, line-height 1.64, h3 de 1.25rem e metadados/TOC de .875rem. O muted `#74695f` tem contraste 4.62:1 sobre o papel `#f3eee4`. Blockquotes mantêm a borda oxblood.

O título curto vem de `spine` no frontmatter de cada tradução, com fallback para `Title`. Não existe mapa central. O índice usa `01 / Título`, com regras discretas.

O lede é uma decisão editorial explícita:

```text
{{< lede >}}
Um parágrafo introdutório escolhido pelo autor.
{{< /lede >}}
```

O shortcode deve conter um único parágrafo. Os textos existentes não recebem lede automaticamente. Seleção, links visitados, foco e notas de rodapé têm estados próprios. Tabelas continuam em um contêiner com rolagem horizontal.

## Navegação e detalhes

`site-nav.html` aparece dentro do hero nas quatro salas e nos ensaios; nas páginas auxiliares, antes do conteúdo. `dock.js` mantém o nome do arquivo por compatibilidade, mas controla somente a busca: `/` abre e foca, `Esc` fecha e retorna à lupa. Campos editáveis e atalhos modificados não são interceptados. Links funcionam sem JavaScript.

Um volume central da estante contém o link para o colophon, disponível por teclado e com identificação ao receber foco. A área acompanha o recorte cover da imagem. O colophon não entra nas listagens nem no índice de busca. A 404 oferece caminhos claros de volta à casa.

## Marca

`static/favicon.svg` é o símbolo mestre: janela vertical com folha entreaberta, paper e oxblood. O favicon é estável, sem mudança temporal. A janela aparece discretamente no rodapé, colophon e 404.

```bash
bash scripts/build-icons.sh
```

ImageMagick gera PNGs de 16, 32, 48, 180, 192 e 512px e o ICO com três resoluções. A versão 16px é desenhada diretamente na grade para manter legibilidade. Não há manifest/PWA no projeto.

## Validação

`verify.sh` constrói produção e desenvolvimento e verifica HTML, SEO, JSON-LD, links, imagens, cache e sintaxe JS. Os testes Node cobrem busca, atalhos, prioridade por horário, aquecimento adiado, economia de dados, decodificações concorrentes e restrições do movimento.

O indicador estático no hero de ensaios e livros é um link nativo para `#leitura`, com alvo focalizável. O status de cada item solicitado está em [REDESIGN-STATUS.md](REDESIGN-STATUS.md).
