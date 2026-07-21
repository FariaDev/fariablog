# FariaBlog

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Hugo](https://img.shields.io/badge/Hugo-v0.164.0-blue.svg)
![Último Commit](https://img.shields.io/github/last-commit/FariaDev/fariablog.svg)

Blog pessoal estático construído com Hugo e uma interface mínima inspirada em [bestmotherfucking.website](https://bestmotherfucking.website/). O projeto serve como arquivo de estudos, leituras e reflexões sobre filosofia, literatura, neurociência e educação.

<p align="center">
  <img src="https://fariablog.com/fariablog.webp" alt="FariaBlog" width="400"/>
</p>

## Funcionalidades Principais

- **Interface:** HTML direto, tipografia nativa, uma coluna legível e modo claro/escuro.
- **Internacionalização:** Suporte multilíngue (Português/Inglês).
- **Navegação:** Busca indexada via Fuse.js, sumário interno, arquivo cronológico e taxonomia por assuntos.
- **Performance:** SEO estruturado, assets fingerprintados e imagens WebP responsivas.

## Tecnologias

- **[Hugo](https://gohugo.io/):** Static Site Generator.
- **Fuse.js:** busca local tolerante a erros.

## Interface

A apresentação usa os padrões de `bestmotherfucking.website`: CSS mínimo, fonte do sistema, largura de leitura de `40em` e elementos nativos do navegador. Busca, taxonomias, imagens responsivas, SEO e internacionalização continuam integrados ao Hugo.

A arquitetura está documentada em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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

## Verificação

```bash
./scripts/verify.sh
```

## Estrutura do Projeto

```text
.
├── assets/         # CSS e JavaScript processados pelo Hugo
├── content/        # Posts e páginas em português e inglês
├── docs/           # Arquitetura e publicação
├── i18n/           # Textos da interface
├── layouts/        # Templates Hugo da apresentação principal
├── scripts/        # Gate de verificação
├── static/         # Imagens e políticas HTTP
├── config.toml     # Configuração principal
└── README.md