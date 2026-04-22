# jeffef.dev - caderno pessoal

Site pessoal em Astro com notas em Markdown e editor web via Decap CMS.

O projeto tem duas experiencias separadas:

- `/` e `/notas/...`: leitura publica do caderno.
- `/admin/`: editor para criar e alterar notas.

A aplicacao ativa fica na raiz com Astro. O pacote antigo foi movido para `legacy/` apenas como referencia enquanto o novo caderno amadurece.

## Estrutura

```txt
jeffef-site/
|-- src/
|   |-- content/
|   |   |-- config.ts
|   |   `-- notas/
|   |       `-- *.md
|   |-- lib/
|   |   `-- notas.ts
|   |-- pages/
|   |   |-- admin/index.astro
|   |   |-- index.astro
|   |   `-- notas/[...slug].astro
|   `-- styles/
|       `-- global.css
|-- public/
|   `-- admin/
|       |-- config.yml
|       `-- config.local.yml
|-- astro.config.mjs
|-- package.json
`-- tsconfig.json
```

## Rodar localmente

Em um terminal:

```bash
npm run dev
```

Em outro terminal, para permitir que o Decap edite arquivos locais:

```bash
npm run cms
```

Depois abra:

- Site publico: `http://localhost:4321/`
- Editor: `http://localhost:4321/admin/`

## Criar notas sem o editor

Crie um arquivo em `src/content/notas/`:

```md
---
title: "Titulo da nota"
date: 2026-04-21
summary: "Resumo curto."
tags: ["vida comum", "trabalho"]
photo: "/uploads/foto.jpg"
photoAlt: "Descricao da foto."
draft: false
---

Texto da nota.
```

## Configurar o Decap CMS para publicar

Edite `public/admin/config.yml` e troque:

```yml
repo: Jeffersonf/jeffef
```

se o repositorio mudar.

Importante: publicar o site no GitHub Pages nao basta para o Decap CMS funcionar em `/admin/`.
O Pages entrega a interface, mas o backend `github` do Decap precisa de um provedor de autenticacao
em producao. Sem isso, a tela pode abrir, mas login e gravacao no repositorio nao funcionam.

Opcoes comuns:

- Netlify Identity + Git Gateway
- um endpoint OAuth proprio para o GitHub
- usar o `/admin/` apenas localmente com `npm run cms`

Este repositorio agora inclui um esqueleto de worker OAuth em `oauth-worker/` para o caminho
"GitHub Pages + OAuth proprio". O fluxo esperado fica assim:

1. GitHub Pages continua servindo `https://jeffersonf.github.io/jeffef/admin/`
2. o popup de login vai para um worker externo em outro dominio/subdominio
3. o worker faz o OAuth com GitHub e devolve o token para o Decap

Passos resumidos:

1. criar um GitHub OAuth App
2. publicar o worker de `oauth-worker/`
3. preencher `base_url` e `auth_endpoint` em `public/admin/config.yml`
4. fazer deploy do site de novo

O Decap salva:

- notas em `src/content/notas/`
- imagens em `public/uploads/`

## Build

```bash
npm run build
```

O site estatico final sai em `dist/`.

## Publicacao

O site publico funciona bem em Vercel, Netlify, Cloudflare Pages ou GitHub Pages.

Para o editor `/admin/`, o caminho mais simples e hospedar com autenticacao em Netlify.
No GitHub Pages, a interface pode ser publicada normalmente, mas a autenticacao do Decap precisa
ser configurada separadamente.

Comando de build:

```bash
npm run build
```

Pasta publicada:

```txt
dist
```
