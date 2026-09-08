# Conferência do refinamento solicitado

O núcleo foi implementado. Nem todas as possibilidades sugeridas foram adicionadas; abaixo estão as soluções provisórias e as escolhas deliberadamente deixadas de fora.

| Item | Situação | Implementação / limite |
| --- | --- | --- |
| 1. Dock | Implementado | Navegação tipográfica no hero, busca separada, alvos de 44px. Sai de cena durante a leitura. |
| 2. Sobre | Provisório, conforme alternativa autorizada | Crop, escala, posição do texto e contraste próprios. Ainda usa as imagens da home; não há novo conjunto de escrivaninha. |
| 3. Índice | Implementado | Catálogo `01 / Título` com regras sutis, sem dotted leaders. |
| 4. Spine | Implementado | Frontmatter de cada tradução, fallback para o título, sem mapa central. |
| 5. Imagens | Implementado no formato atual | Imagem selecionada prioritária; variantes após load/idle, com proteção para economia de dados e troca após decode. WebP responsivo; AVIF não foi adicionado. |
| 6. Movimento | Implementado | Mouse somente com pointer fino + hover; aproximação mínima por scroll em rAF; reduced motion respeitado. |
| 7. View Transitions | Implementado e refinado | Cena e navegação nomeadas; título selecionado compartilhado entre catálogo e hero. Limpeza para BFCache. Validação visual no Chromium; outros motores não foram testados. |
| 8. Easter egg | Implementado | Área sobre um volume da estante abre colophon; acessível por teclado, identificada ao focar. Sem animal ou luminária interativa. |
| 9. Sinais de cuidado | Seleção implementada | Colophon bilíngue, 404 contextual, `/`, `Esc`, foco, seleção e visitados. Relógio/fase lunar e alteração por novo livro não foram escolhidos. |
| 10. Atmosfera adicional | Parcial e contida | Pequena diferença estática de tom ao entardecer. Sem vaga-lumes, poeira, partículas ou nova luz interativa. |
| 11. Ensaios | Implementado | 43rem, corpo preservado, line-height 1.64, hierarquia h2/h3, metadados/TOC 14px, muted 4.62:1. Le­de explícito via shortcode; nenhum ensaio foi marcado automaticamente. Blockquotes preservados. |
| 12. Estados de leitura | Implementado | Seleção, underline, visitados, foco e estilos de notas de rodapé. Rolagem horizontal de tabelas preservada. |
| 13. Marca | Símbolo e assets implementados | Janela entreaberta; SVG/ICO e PNGs 16/32/48/180/192/512. Revisão rasterizada de 16/32/48. Marca estável; variantes grandes noon/dusk/midnight não foram criadas. Não há manifest/PWA. |
| 14. Assinatura | Implementado | Janela discreta no rodapé, colophon e 404. |
| 15. Contenção | Preservada | Sem cursor, som, WebGL, grain animado ou partículas contínuas. |
| 16. Originalidade | Direção aplicada | Casa, papel, janela, iluminação local e catálogo substituem as soluções mais literais da referência. A avaliação estética final continua sendo sua. |
| 17. Prioridade | Seguida | Estrutura, leitura e carregamento vieram antes dos detalhes opcionais. |

## Ajustes posteriores

- O título selecionado viaja da linha do catálogo ao título no hero, também no retorno. Em navegadores sem suporte à transição entre documentos, os links mantêm navegação normal.
- “Ler o ensaio” / “Explorar a bibliografia” sinalizam conteúdo abaixo da cena. São links nativos, estáticos, que levam ao papel e transferem o foco, inclusive sem JavaScript.
- O comportamento de transições entre documentos segue os eventos `pageswap` e `pagereveal`, conforme a [documentação da API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using).

## Verificação

Builds de produção e desenvolvimento; validação de HTML, SEO, links, imagens e cache; 21 testes Node. Inspeção no navegador de desktop/mobile, seleção do título na transição e salto/foco do indicador.
