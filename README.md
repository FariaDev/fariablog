# FariaBlog

**Uma casa para leitura.** Ensaios e notas de Lucas Faria sobre filosofia, literatura, neurociência e educação, acompanhados de uma estante de livros lidos.

[Visitar o site](https://fariablog.com/pt-br/) · [Read in English](https://fariablog.com/en/)

![FariaBlog: papel claro, janela entreaberta e uma escrivaninha iluminada](static/og/fariablog.jpg)

## A casa

Início, Textos, Livros e Sobre são vistas do mesmo lugar. As cenas acompanham a hora local; ao entrar em um ensaio ou na bibliografia, a casa dá lugar ao papel.

- **Leitura:** coluna editorial, tipografia serifada, sumário, notas e navegação entre ensaios.
- **Navegação:** catálogo de textos, assuntos, arquivo e busca local com Fuse.js. `/` abre a busca; `Esc` fecha.
- **Luminária:** clique na imagem no Início ou no Sobre para acender/apagar ao entardecer e à noite. A escolha acompanha a navegação na mesma sessão.
- **Carregamento:** AVIF e WebP responsivos, prévias pequenas embutidas, prioridade para a cena ativa e aquecimento adiado das outras exposições.
- **Acessibilidade:** teclado, foco visível, alvos de toque e respeito à preferência por movimento reduzido e à economia de dados.
- **Compartilhamento:** banners com “Faria Blog”, a logo e a cena da casa; títulos e descrições próprios por página e idioma nos metadados.

O site entrega HTML estático, sem banco de dados, painel administrativo, analytics ou scripts de rastreamento. As versões em português e inglês são mantidas em arquivos separados.

## Desenvolvimento local

Requisitos: Hugo **Extended 0.148.1 ou superior**, Python 3.11+ e Node.js 18+ com npm. O CI verifica Hugo 0.148.1 e 0.164.0; não valida individualmente todas as versões intermediárias.

```bash
git clone https://github.com/FariaDev/fariablog.git
cd fariablog
npm ci
hugo server -D
```

Abra <http://localhost:1313/pt-br/>. A opção `-D` inclui rascunhos na prévia local.

## Editar e publicar conteúdo

| Conteúdo | Arquivo ou diretório |
| --- | --- |
| Artigos em português | `content/pt-br/posts/` |
| Artigos em inglês | `content/en/posts/` |
| Lista de livros | `content/pt-br/books.md` e `content/en/books.md` |
| Sobre | `content/pt-br/about.md` e `content/en/about.md` |
| Frases da interface | `i18n/pt-br.yaml` e `i18n/en.yaml` |

Para um artigo novo, use um existente como referência. Preencha `title`, `description`, `summary`, `date`, `tags` e `translationKey`; `spine` é o título curto mostrado no catálogo. O gate atual exige um par PT/EN com o mesmo `translationKey`. Use `draft = true` enquanto prepara o texto.

`description` resume a página para busca e compartilhamento; `summary` serve às listagens e feeds. O campo opcional `seoTitle` permite um título específico para os metadados sem mudar o título visível. Os banners são gerados automaticamente; não é preciso desenhar uma imagem para cada novo artigo.

Antes de publicar:

```bash
bash scripts/verify.sh
```

Envie uma branch e abra um PR. Depois dos checks aprovados, o merge na `main` aciona a publicação pelo Cloudflare Pages. Confira a versão no domínio público.

## Verificação e assets

O gate constrói produção e desenvolvimento, confere HTML, links, JSON-LD, metadados, imagens sociais, sitemaps, política de cache e executa os testes JavaScript.

Comandos de manutenção visual:

```bash
bash scripts/build-icons.sh          # favicon e assinaturas
python3 scripts/build-house-avif.py  # AVIF e miniaturas das cenas
node scripts/build-social-base.mjs   # moldura dos cartões
bash scripts/update-readme-banner.sh # banner do README e URL histórica
```

A regeneração usa ImageMagick; os scripts Node usam o resvg fixado no lockfile. O CI confere os AVIFs já versionados sem precisar de um encoder. A fonte Libre Caslon Text, sob licença OFL em `assets/fonts/`, é usada apenas para rasterizar os banners no build; não é baixada pelo navegador.

## Estrutura

```text
assets/   # Cenas, AVIFs, marca, fonte dos banners, CSS e JavaScript
content/  # Artigos e páginas em português e inglês
data/     # Manifesto de imagens e miniaturas embutidas
docs/     # Arquitetura, conteúdo visual, SEO e publicação
i18n/     # Textos traduzidos da interface
layouts/  # Templates Hugo e geração dos cartões sociais
scripts/  # Validação e regeneração de assets
tests/    # Testes de comportamento do JavaScript
static/   # Ícones, imagens públicas e políticas HTTP
```

## Documentação

- [Arquitetura e funcionamento](docs/ARCHITECTURE.md)
- [SEO e compartilhamento](docs/SEO-SHARING.md)
- [Cenas, formatos e referências visuais](docs/ABOUT-IMAGES.md)
- [Publicação e rollback](docs/DEPLOYMENT.md)
