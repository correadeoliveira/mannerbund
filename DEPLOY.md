# Publicação

O protótipo está publicado em:

- Aplicativo principal (mapa, comunidades, conversas, feed e perfil): <https://saif-cy.github.io/mannerbund/mapa>
- Experiência de visitante nas guildas: <https://saif-cy.github.io/mannerbund/>

O site é um SPA estático. Não há servidor de aplicação, autenticação real nem banco compartilhado: cada pessoa usa o cenário demonstrativo salvo no próprio navegador (IndexedDB). O mapa usa o estilo público do OpenFreeMap. Como o GitHub Pages serve HTTPS, a localização real do navegador também funciona.

## Como o build público é feito

O build normal continua usando a raiz do domínio:

```sh
npm run build
```

O build para o GitHub Pages usa o subdiretório `/mannerbund/`, ajusta o `basename` do React Router e gera um `404.html` com o mesmo shell do app para que links profundos funcionem em recarregamentos:

```sh
npm run build:pages
```

O resultado fica em `dist/`. O `404.html` é criado por `scripts/prepare-pages.mjs`.

## Repositório de publicação

O conteúdo de `dist/` é publicado na branch `gh-pages` de
<https://github.com/SAIF-CY/mannerbund>. Esse repositório contém apenas o
artefato de build; o código-fonte permanece no repositório original.

Para republicar depois de uma alteração:

```sh
npm run build:pages
cd dist
git add -A
git commit -m "deploy: publicar nova versão"
git push origin gh-pages
```

O GitHub Pages está configurado para publicar a branch `gh-pages` na raiz.
Também é possível usar `npm run preview:pages` para conferir o build com o
mesmo subdiretório antes de publicar.

## Limites desta publicação

- Os dados são locais ao navegador e à origem. Não há sincronização entre pessoas ou dispositivos.
- As personas, mensagens, guildas e progresso são simulados.
- Não há cadastro, senha, moderação central ou pagamento real.
- Para um serviço multiusuário de verdade, será necessário um backend com autenticação, banco compartilhado, tempo real e moderação. Veja `ARCHITECTURE.md`.
