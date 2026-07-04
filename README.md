# Planning Poker

Aplicacao web estatica para executar sessoes de planning poker com React, Vite e PeerJS. O app pode ser usado localmente, em uma unica tela compartilhada, ou em uma sala online com multiplos participantes entrando por codigo/link.

Aplicacao publicada:

[https://gedsonmarcelino.github.io/planning-poker/](https://gedsonmarcelino.github.io/planning-poker/)

## Recursos

- Criacao de sala com codigo curto.
- Entrada de participantes por codigo ou link compartilhado.
- Votacao individual com votos ocultos ate o host revelar.
- Indicador de participantes que ja votaram.
- Media, mediana, voto mais escolhido e distribuicao por carta.
- Decks prontos: Fibonacci e T-shirt.
- Deck customizado com valores definidos pelo host.
- Limpar votos e iniciar nova rodada.
- Persistencia local para o modo de uso no mesmo navegador.
- Deploy automatico para GitHub Pages via GitHub Actions.

## Como Usar

### Criar uma sala

1. Acesse a aplicacao.
2. Informe seu nome.
3. Clique em `Criar`.
4. Compartilhe o codigo da sala ou use `Copiar link`.
5. Mantenha a aba do host aberta durante a sessao.

O host controla:

- Historia ou tarefa da rodada.
- Deck usado na votacao.
- Revelar ou ocultar votos.
- Limpar votos.
- Nova rodada.

### Entrar em uma sala

1. Acesse o link compartilhado pelo host ou abra a aplicacao.
2. Informe seu nome.
3. Digite o codigo da sala.
4. Clique em `Entrar`.
5. Escolha sua carta quando a rodada estiver pronta.

### Usar no mesmo navegador

Use a opcao `Usar no mesmo navegador` quando quiser conduzir a sessao em tela compartilhada, sem sala online. Nesse modo, voce pode adicionar participantes manualmente e alternar quem esta votando.

## Deck Customizado

O host pode selecionar `Customizado` no campo `Deck` e informar os valores das cartas.

Os valores podem ser separados por:

- Virgula
- Espaco
- Ponto e virgula
- Quebra de linha

Exemplos:

```txt
0, 1, 2, 3, 5, 8, 13, ?
```

```txt
XS S M L XL
```

```txt
0.5
1
2
4
8
16
?
```

Quando o deck customizado muda, os votos da rodada sao limpos para evitar estimativas feitas com cartas antigas.

## Como Funciona a Sala Online

O projeto e uma aplicacao estatica, entao ele nao possui backend proprio. Para permitir salas com multiplos usuarios em GitHub Pages, o app usa PeerJS/WebRTC.

Fluxo resumido:

1. O host cria uma sala.
2. O navegador do host abre um peer com o codigo da sala.
3. Participantes entram usando esse codigo.
4. Cada participante envia o voto para o host.
5. O host sincroniza o estado da rodada para todos.

Importante:

- O host precisa manter a aba aberta.
- Se o host fechar a aba, a sala e encerrada.
- A conexao depende do servico publico de sinalizacao do PeerJS.
- Em algumas redes corporativas, VPNs ou firewalls restritivos, WebRTC pode ser bloqueado.

## Tecnologias

- React 18
- Vite
- PeerJS
- Lucide React
- GitHub Pages
- GitHub Actions

## Requisitos

- Node.js 24 recomendado para o workflow de deploy.
- Node.js 18 ou superior para rodar localmente.
- npm

## Rodar Localmente

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra a URL exibida no terminal. Normalmente:

```txt
http://localhost:5173/
```

## Gerar Build

```bash
npm run build
```

O site estatico sera gerado na pasta `dist/`.

Para testar o build localmente:

```bash
npm run preview
```

## Deploy no GitHub Pages

Este projeto ja inclui o workflow:

```txt
.github/workflows/deploy.yml
```

O workflow executa:

1. Checkout do codigo.
2. Setup do Node.js 24.
3. Instalacao com `npm ci`.
4. Build com `npm run build`.
5. Upload do artefato `dist`.
6. Deploy no GitHub Pages.

Para o deploy funcionar:

1. O repositorio precisa estar publico, ou o plano do GitHub precisa permitir Pages em repositorios privados.
2. Em `Settings > Pages`, a fonte deve ser `GitHub Actions`.
3. O push deve ser feito na branch `main`.

Depois disso, cada push na `main` dispara um novo deploy.

## Estrutura do Projeto

```txt
.
|-- .github/workflows/deploy.yml
|-- index.html
|-- package.json
|-- src
|   |-- App.jsx
|   |-- main.jsx
|   |-- styles.css
|   `-- usePlanningPokerRoom.js
`-- vite.config.js
```

Arquivos principais:

- `src/App.jsx`: interface, estado da rodada, participantes, decks e acoes do host.
- `src/usePlanningPokerRoom.js`: conexao P2P com PeerJS e sincronizacao entre host e participantes.
- `src/styles.css`: estilos da aplicacao e responsividade.
- `vite.config.js`: configuracao do Vite para build estatico compativel com GitHub Pages.
- `.github/workflows/deploy.yml`: pipeline de deploy automatico.

## Scripts Disponiveis

```bash
npm run dev
```

Inicia o ambiente de desenvolvimento.

```bash
npm run build
```

Gera a versao estatica em `dist/`.

```bash
npm run preview
```

Serve localmente o build gerado.

## Limitacoes Conhecidas

- Nao ha banco de dados.
- O historico das rodadas nao e salvo em servidor.
- A sala depende do host estar online.
- A sincronizacao online depende de WebRTC e do servico publico do PeerJS.
- O modo local salva estado no `localStorage` do navegador.

## Solucao de Problemas

### O deploy falhou com `GitHub Pages has not been enabled`

Verifique em `Settings > Pages` se a fonte esta configurada como `GitHub Actions`.

### O deploy falhou em repositorio privado

GitHub Pages em repositorios privados depende do plano da conta/organizacao. Torne o repositorio publico ou use um plano que suporte Pages privado.

### Um participante nao consegue entrar na sala

Confira:

- Se o codigo da sala esta correto.
- Se o host ainda esta com a aba aberta.
- Se a rede do participante permite WebRTC.
- Se algum firewall, VPN ou rede corporativa esta bloqueando conexoes P2P.

### A pagina abriu sem estilos ou scripts

O projeto usa `base: './'` no `vite.config.js` para funcionar em subcaminhos do GitHub Pages. Se alterar essa configuracao, confira se os assets continuam sendo carregados corretamente.

## Licenca

Este projeto ainda nao possui uma licenca definida.
