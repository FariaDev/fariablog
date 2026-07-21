# Publicação e rollback da interface mínima

Status: **interface mínima adotada na branch principal**.

## Gate antes da publicação

```bash
./scripts/verify.sh
```

O gate valida builds de produção e desenvolvimento, metadados multilíngues, JSON-LD, links, HTML, imagens responsivas, busca e políticas de cache.

## Verificação manual

Antes do deploy, conferir:

- home em português e inglês;
- pelo menos um artigo longo com imagem, código e tabela;
- busca com e sem JavaScript;
- índices de assuntos e arquivo;
- alternância de tema;
- impressão.

## Histórico e rollback

Para reverter, publique o commit anterior desejado ou crie uma branch a partir dele e execute novamente `./scripts/verify.sh`.
