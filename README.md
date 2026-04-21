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
repo: seu-usuario/jeffef-site
```

pelo repositorio real no GitHub.

O Decap salva:

- notas em `src/content/notas/`
- imagens em `public/uploads/`

## Build

```bash
npm run build
```

O site estatico final sai em `dist/`.

## Publicacao

Funciona bem em Vercel, Netlify, Cloudflare Pages ou GitHub Pages.

Comando de build:

```bash
npm run build
```

Pasta publicada:

```txt
dist
```
