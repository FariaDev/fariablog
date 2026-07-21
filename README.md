# FariaBlog

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Hugo](https://img.shields.io/badge/Hugo-v0.164.0-blue.svg)
![Último Commit](https://img.shields.io/github/last-commit/FariaDev/fariablog.svg)

Blog pessoal estático construído com Hugo e uma interface editorial inspirada no site de [Dario Amodei](https://darioamodei.com/). O projeto serve como arquivo de estudos, leituras e reflexões sobre filosofia, literatura, neurociência e educação.

<p align="center">
  <img src="https://fariablog.com/fariablog.webp" alt="FariaBlog" width="400"/>
</p>

## Funcionalidades Principais

- **Interface:** HTML direto, tipografia serifada, uma coluna editorial e modo claro/escuro.
- **Internacionalização:** Suporte multilíngue (Português/Inglês).
- **Navegação:** Busca indexada via Fuse.js, sumário interno, arquivo cronológico e taxonomia por assuntos.
- **Performance:** SEO estruturado, assets fingerprintados e imagens WebP responsivas.

## Tecnologias

- **[Hugo](https://gohugo.io/):** Static Site Generator.
- **Fuse.js:** busca local tolerante a erros.

## Interface

A apresentação segue a sobriedade de `darioamodei.com`: fundo quente, tipografia serifada, coluna estreita, listas simples e um controle de tema discreto. Busca, taxonomias, imagens responsivas, SEO e internacionalização continuam integrados ao Hugo.

A arquitetura está documentada em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e o contrato do Cloudflare Pages em [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Instalação e Execução

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Hugo Extended](https://gohugo.io/getting-started/installing/) 0.148.1 ou superior; 0.164.0 é a versão recomendada e testada;
- [Python](https://www.python.org/) 3.11 ou superior, usado pelo gate de verificação;
- [Node.js](https://nodejs.org/) 18 ou superior, com npm, usado para validar e testar o JavaScript.

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

Instale as dependências usadas apenas pelos testes e execute o gate:

```bash
npm ci
./scripts/verify.sh
```

O CI executa esse gate com Hugo Extended 0.148.1 e 0.164.0. As versões representam os limites testados; versões intermediárias não são verificadas individualmente.

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