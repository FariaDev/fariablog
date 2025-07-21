# FariaBlog

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Hugo](https://img.shields.io/badge/Hugo-v0.148.1-blue.svg)
![Último%20Commit](https://img.shields.io/github/last-commit/FariaDev/fariablog.svg)

Um blog pessoal moderno e elegante construído com Hugo e o tema PaperMod. Aqui compartilho insights, reflexões e descobertas, documentando meus estudos, leituras e pensamentos.

<p align="center">
  <img src="fariablog.webp" alt="FariaBlog" width="400"/>
</p>

## ✨ Destaques

- **🎨 Interface e Design:** Visual minimalista, responsivo, com modo claro/escuro, tipografia otimizada e animações suaves.
- **🌐 Multilíngue:** Conteúdo disponível em português e inglês.
- **🔍 Navegação e Busca:** Busca em tempo real (Fuse.js), breadcrumbs, organização por categorias e tags.
- **💬 Interatividade:** Sistema de comentários leve (Disqus), botões de compartilhamento social.
- **⚡ Otimização:** SEO avançado, carregamento progressivo de imagens, compressão de assets e suporte a PWA.

## 🛠️ Tecnologias Utilizadas

- **[Hugo](https://gohugo.io/):** Gerador de sites estáticos de alta performance.
- **[PaperMod](https://github.com/adityatelange/hugo-PaperMod):** Tema minimalista, rápido e responsivo (adicionado como submódulo Git).
- **[Disqus](https://disqus.com/):** Sistema de comentários (pode ser trocado por outro, como Cusdis, se desejar).

## 🚀 Executando Localmente

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Hugo](https://gohugo.io/getting-started/installing/) (versão estendida)

### Passos

1. Clone o repositório:
    ```bash
    git clone https://github.com/FariaDev/fariablog.git
    ```

2. Entre no diretório do projeto:
    ```bash
    cd fariablog
    ```

3. Atualize o submódulo do tema:
    ```bash
    git submodule update --init --recursive
    ```

4. Inicie o servidor de desenvolvimento do Hugo:
    ```bash
    hugo server -D
    ```

5. Abra seu navegador e acesse `http://localhost:1313`.

## 📂 Estrutura do Projeto

```text
.
├── assets/         # Recursos personalizados (CSS, JS)
├── content/        # Conteúdo do blog (pt-br, en)
├── layouts/        # Layouts e templates HTML personalizados
├── public/         # Saída do site gerado (não versionado)
├── static/         # Arquivos estáticos (imagens, ícones, manifest)
├── themes/         # Tema PaperMod (submódulo Git)
├── config.toml     # Configuração principal do site
└── .gitignore      # Arquivos/diretórios ignorados pelo Git
```

## 🔧 Configuração

O arquivo `config.toml` centraliza todas as configurações do site, permitindo ajustar:

- Informações do site (título, URL base, idiomas)
- Parâmetros do tema PaperMod
- Menus de navegação
- Links para redes sociais
- Configuração do sistema de comentários

## 🤝 Contribuições

Contribuições são bem-vindas! Para bugs ou sugestões, abra uma [issue](https://github.com/FariaDev/fariablog/issues). Para adicionar funcionalidades, envie um [pull request](https://github.com/FariaDev/fariablog/pulls).

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📫 Contato

- **Email:** fariablog1@gmail.com
- **GitHub:** [@FariaDev](https://github.com/FariaDev)
