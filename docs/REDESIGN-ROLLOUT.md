# Rollout e rollback do redesign

Status: **redesign aprovado e adotado na branch principal**.

## Gate antes da publicação

```bash
./scripts/verify.sh
```

O gate exige:

- builds Hugo de produção e desenvolvimento;
- metadados específicos por idioma;
- JSON-LD válido;
- canonical, hreflang e robots coerentes;
- ausência de referências internas quebradas;
- imagens editoriais responsivas, dimensionadas e com alt textual;
- Fuse restrito à página de busca e índice contendo apenas posts;
- políticas de cache compatíveis com URLs fingerprintadas e estáveis;
- sintaxe JavaScript válida.

## Versão anterior

O PaperMod anterior corresponde exatamente ao commit `18f2b55` e à tag anotada `pre-redesign`. A tag inclui a referência do submódulo usada naquela versão.

### Comparação local

```bash
git worktree add ../fariablog-legacy pre-redesign
(cd ../fariablog-legacy && git submodule update --init --recursive)

hugo server -D --port 1313
(cd ../fariablog-legacy && hugo server -D --port 1414)
```

### Rollback

1. interromper o deploy da branch principal;
2. publicar a tag `pre-redesign` ou criar uma branch a partir dela;
3. inicializar o submódulo PaperMod;
4. executar o gate disponível naquela versão;
5. investigar a regressão no redesign sem reescrever o histórico.

## Pós-publicação

Verificações que dependem do domínio real:

- carregar comentários Disqus mediante consentimento;
- confirmar eventos no Umami;
- testar home, artigo, busca, idioma, RSS e 404;
- confirmar headers HTTP do provedor.
