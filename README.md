# FariaBlog

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Hugo](https://img.shields.io/badge/Hugo-v0.164.0-blue.svg)
![Último Commit](https://img.shields.io/github/last-commit/FariaDev/fariablog.svg)

Blog pessoal estático construído com Hugo, com uma interface documental própria inspirada em papers e tipografia acadêmica. O projeto serve como arquivo de estudos, leituras e reflexões sobre filosofia, literatura, neurociência e educação.

<p align="center">
  <img src="https://fariablog.com/fariablog.webp" alt="FariaBlog" width="400"/>
</p>

## Funcionalidades Principais

- **Interface:** Design minimalista e responsivo com suporte nativo a modo claro/escuro.
- **Internacionalização:** Suporte multilíngue (Português/Inglês).
- **Navegação:** Busca indexada via Fuse.js, sumário interno, arquivo cronológico e taxonomia por assuntos.
- **Social:** Integração com Disqus para comentários e links de compartilhamento.
- **Performance:** SEO estruturado, assets fingerprintados e imagens WebP responsivas.

## Tecnologias

- **[Hugo](https://gohugo.io/):** Static Site Generator.
- **STIX Two Text:** tipografia principal hospedada localmente.
- **Fuse.js:** busca local tolerante a erros.
- **[Disqus](https://disqus.com/):** comentários carregados mediante ação do leitor.

## Versões visuais

O redesign A1 é a apresentação principal. A versão PaperMod anterior está preservada de forma imutável na tag Git `pre-redesign`.

Para comparar lado a lado, execute o redesign nesta pasta e abra o legado em um worktree temporário:

```bash
hugo server -D --port 1313
git worktree add ../fariablog-legacy pre-redesign
(cd ../fariablog-legacy && git submodule update --init --recursive && hugo server -D --port 1414)
```

O rollback consiste em publicar a tag, sem manter uma segunda aplicação dentro da branch principal. Consulte `docs/REDESIGN.md` e `docs/REDESIGN-ROLLOUT.md`.

## Instalação e Execução

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Hugo Extended](https://gohugo.io/getting-started/installing/)

### Passos

1. Clone o repositório:
    ```bash
    git clone https://github.com/FariaDev/fariablog.git
    ```

2. Acesse o diretório:
    ```bash
    cd fariablog
    ```

3. Execute o servidor local:
    ```bash
    hugo server -D
    ```

4. Acesse `http://localhost:1313/pt-br/`.

## Estrutura do Projeto

```text
.
├── assets/         # CSS e JavaScript processados pelo Hugo
├── content/        # Posts e páginas em português e inglês
├── docs/           # Arquitetura do redesign e protocolo de rollout
├── i18n/           # Textos da interface
├── layouts/        # Templates Hugo da apresentação principal
├── scripts/        # Gate de verificação
├── static/         # Imagens, fontes, ícones e políticas HTTP
├── config.toml     # Configuração principal
└── README.md