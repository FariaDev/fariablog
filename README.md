# FariaBlog

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Hugo](https://img.shields.io/badge/Hugo-v0.148.1-blue.svg)
![Último Commit](https://img.shields.io/github/last-commit/FariaDev/fariablog.svg)

Blog pessoal estático construído com Hugo e o tema PaperMod. O projeto serve como repositório para documentação de estudos, insights e reflexões sobre tecnologia, filosofia e literatura.

<p align="center">
  <img src="https://fariablog.com/fariablog.webp" alt="FariaBlog" width="400"/>
</p>

## Funcionalidades Principais

- **Interface:** Design minimalista e responsivo com suporte nativo a modo claro/escuro.
- **Internacionalização:** Suporte multilíngue (Português/Inglês).
- **Navegação:** Busca indexada via Fuse.js, breadcrumbs e taxonomia por tags/categorias.
- **Social:** Integração com Disqus para comentários e links de compartilhamento.
- **Performance:** Otimizado para SEO, carregamento progressivo de imagens (lazy loading) e suporte a PWA.

## Tecnologias

- **[Hugo](https://gohugo.io/):** Static Site Generator.
- **[PaperMod](https://github.com/adityatelange/hugo-PaperMod):** Tema base (gerenciado via Git Submodule).
- **[Disqus](https://disqus.com/):** Sistema de comentários.

## Instalação e Execução

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Hugo Extended](https://gohugo.io/getting-started/installing/)

### Passos

1. Clone o repositório:
    ```bash
    git clone [https://github.com/FariaDev/fariablog.git](https://github.com/FariaDev/fariablog.git)
    ```

2. Acesse o diretório:
    ```bash
    cd fariablog
    ```

3. Inicialize os submódulos do tema:
    ```bash
    git submodule update --init --recursive
    ```

4. Execute o servidor local:
    ```bash
    hugo server -D
    ```

5. Acesse `http://localhost:1313`.

## Estrutura do Projeto

```text
.
├── assets/         # CSS e JS personalizados
├── content/        # Posts e páginas (Markdown)
├── layouts/        # Sobrescrita de templates HTML
├── public/         # Build final (ignorado no git)
├── static/         # Imagens, ícones e assets estáticos
├── themes/         # Submódulo do PaperMod
├── config.toml     # Configurações globais
└── .gitignore