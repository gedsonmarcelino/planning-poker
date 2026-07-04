# Planning Poker

Aplicacao web estatica em React para executar sessoes de planning poker. Ela permite criar uma sala, compartilhar um codigo/link e receber multiplos participantes em tempo real usando conexao P2P via PeerJS.

O host tambem pode usar um deck customizado. Selecione `Customizado` no campo `Deck` e informe os valores separados por virgula, espaco, ponto e virgula ou quebra de linha.

Como o GitHub Pages hospeda apenas arquivos estaticos, a sala depende do servico publico de sinalizacao do PeerJS para conectar os navegadores. O host da sala precisa manter a aba aberta durante a rodada.

## Rodar localmente

```bash
npm install
npm run dev
```

## Gerar build

```bash
npm run build
```

O site estatico sera gerado na pasta `dist/`.

## Publicar no GitHub Pages

Este projeto ja inclui um workflow em `.github/workflows/deploy.yml`.

1. Crie um repositorio no GitHub e envie estes arquivos.
2. No GitHub, va em `Settings > Pages`.
3. Em `Build and deployment`, selecione `GitHub Actions`.
4. Faca push na branch `main`.

O workflow vai executar `npm ci`, `npm run build` e publicar a pasta `dist/`.
