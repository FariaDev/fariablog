# Publicação e rollback da interface mínima

Status: **interface mínima adotada na branch principal e publicada pelo Cloudflare Pages**.

## Responsabilidades

- O GitHub Actions apenas verifica pushes e pull requests com Hugo Extended 0.148.1 e 0.164.0.
- O Cloudflare Pages acompanha a branch `main` e faz o deploy de produção.
- `static/_headers` é a fonte versionada das políticas de cache copiadas para a saída do Hugo.

## Configuração do Cloudflare Pages

Use estes valores para reproduzir o projeto:

| Campo | Valor |
|---|---|
| Repositório | `FariaDev/fariablog` |
| Branch de produção | `main` |
| Comando de build | `hugo --gc --minify --environment production` |
| Diretório de saída | `public` |
| Hugo | Extended 0.164.0 |
| Domínio | `fariablog.com` |

Não há segredos de aplicação. Se o ambiente de build não fornecer a versão correta automaticamente, configure apenas `HUGO_VERSION=0.164.0`. Nunca registre tokens ou identificadores privados neste documento.

Cloudflare Web Analytics e Zaraz devem permanecer desativados para preservar a política sem trackers. Speed Brain está ativo como prefetch de navegação; ele é opcional e pode ser desativado no painel sem alterar o site.

## Gate antes da publicação

Instale as dependências de teste quando houver um `package-lock.json` e execute:

```bash
npm ci
./scripts/verify.sh
```

Sem `package-lock.json`, basta executar o gate. Ele valida builds de produção e desenvolvimento, metadados multilíngues, JSON-LD, links, HTML, imagens responsivas, busca e políticas de cache.

## Verificação após o deploy

Confirme que o deploy do Pages aponta para o SHA esperado e execute:

```bash
curl -sSIL https://fariablog.com/pt-br/
curl -sSIL https://fariablog.com/pt-br/index.json
curl -sSL https://fariablog.com/pt-br/search/ | grep -F 'fuse.basic'
curl -sSL https://fariablog.com/pt-br/ | grep -Ei 'umami|google-analytics|googletagmanager|disqus|zaraz'
```

Resultados esperados:

- home e índice de busca retornam HTTP 200 e uma única política `Cache-Control`;
- a busca carrega Fuse somente em sua rota;
- o último comando não encontra trackers;
- um artigo com imagens apresenta `srcset`, dimensões e texto alternativo;
- home, busca, assuntos, arquivo, tema e impressão funcionam nos dois idiomas.

## Cache

HTML, RSS e índices localizados usam cache curto com revalidação. CSS, JavaScript e outros recursos fingerprintados usam cache imutável. Imagens editoriais estáveis continuam revalidáveis.

Um deploy normal deve invalidar a versão anterior. Faça purge manual no painel do Cloudflare apenas quando o conteúdo publicado não corresponder ao SHA ativo ou quando uma política de cabeçalho antiga persistir. Prefira purge por URL; use purge total somente quando várias rotas estiverem inconsistentes.

## Rollback

1. Identifique um commit conhecido e execute `./scripts/verify.sh` nele.
2. Reverta a alteração em `main` com um novo commit, preservando o histórico.
3. Aguarde o novo deploy do Cloudflare Pages.
4. Repita os testes de fumaça acima e faça purge apenas se necessário.

Não use uma branch temporária como produção permanente e não restaure artefatos de `public/`; o Pages deve sempre reconstruir a saída a partir do código-fonte.
