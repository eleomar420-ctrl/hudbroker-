# HudBroker

Plataforma de operações binárias sobre criptomoedas (preço real via Binance, 24/7), com painel de cliente, admin, backoffice e sistema de afiliados.

**Modo atual: demo/sandbox.** Saldo inicial virtual de $10.000, sem gateway de pagamento real conectado. Os preços e a lógica de execução são reais — só o dinheiro é simulado.

Banco de dados: **PostgreSQL** (pronto para produção, dados persistem entre reinicializações).

## O que está incluído

- **App do cliente** — gráfico TradingView ao vivo, abertura de operações sobre preço real de cripto (Binance), histórico
- **Painel admin** — visão geral financeira, gestão de usuários (KYC, suspensão), listagem de operações e afiliados
- **Backoffice** — aprovação/rejeição de solicitações de saque
- **Painel de afiliados** — link de divulgação, tracking de cliques, comissão CPA + revenue share, solicitação de saque

## Rodando localmente

Requisitos: Node.js 22+, um banco PostgreSQL (local ou na nuvem).

```bash
cd backend
npm install
cp .env.example .env
# edite .env com sua DATABASE_URL
npm start
```

| Painel | URL | Login |
|---|---|---|
| Cliente | `/client/login.html` | crie sua própria conta |
| Admin | `/admin/login.html` | `admin@hudbroker.com` / `admin123` |
| Backoffice | `/backoffice/index.html` | mesma sessão do admin |
| Afiliados | `/affiliates/index.html` | `afiliado@hudbroker.com` / `afiliado123` |

> Troque essas senhas demo antes de expor o sistema publicamente.

---

## Deploy em produção com domínio próprio (via Railway)

Este é o caminho recomendado para quem não tem experiência com servidores/SSH — a Railway cuida da infraestrutura, você só conecta o domínio.

### Passo 1 — Subir o código para o GitHub

A Railway faz deploy a partir de um repositório GitHub.

1. Crie uma conta em [github.com](https://github.com) se ainda não tiver
2. Crie um novo repositório (pode ser privado)
3. Suba a pasta `hudbroker` inteira para esse repositório

### Passo 2 — Criar o projeto na Railway

1. Crie uma conta em [railway.com](https://railway.com) (pode entrar com GitHub)
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório que você criou
4. Nas configurações do serviço, defina o **Root Directory** como `backend` (importante: o projeto tem `backend/` e `frontend/` na mesma pasta raiz)

### Passo 3 — Adicionar o banco PostgreSQL

1. Dentro do mesmo projeto na Railway, clique em **New** → **Database** → **Add PostgreSQL**
2. A Railway cria o banco e injeta automaticamente a variável `DATABASE_URL` no seu serviço — você não precisa copiar nada manualmente

### Passo 4 — Configurar variáveis de ambiente

No serviço do backend, vá em **Variables** e adicione:

```
JWT_SECRET=<gere uma string aleatória longa, ex: openssl rand -hex 32>
```

A `DATABASE_URL` já estará lá automaticamente (vinda do passo 3). Não defina `PORT` — a Railway cuida disso.

### Passo 5 — Conectar seu domínio

1. No serviço do backend, vá em **Settings** → **Networking** → **Custom Domain**
2. Digite seu domínio (ex: `hudbroker.com`)
3. A Railway vai te mostrar um registro DNS para criar — geralmente um **CNAME** apontando para algo como `xxxx.up.railway.app`
4. Vá até o painel do seu provedor de domínio (Registro.br, GoDaddy, Namecheap, etc.) e crie esse registro DNS exatamente como mostrado
5. Aguarde a propagação (de minutos a algumas horas) — a Railway emite o certificado HTTPS automaticamente, sem você precisar fazer nada

Depois disso, seu domínio já estará servindo a plataforma com HTTPS configurado.

### Verificando que funcionou

Acesse `https://seudominio.com/api/health` — se aparecer `{"ok":true,"name":"HudBroker API"}`, está tudo certo.

---

## Arquitetura

```
backend/src/
  db/             schema PostgreSQL + conexão (pool de conexões via pg)
  services/
    priceFeed.js       conecta WebSocket da Binance (BTC, ETH, SOL, BNB)
    tradeEngine.js      abre/resolve operações sobre preço real
    commissionEngine.js  tracking de afiliado + cálculo de comissão
  routes/         endpoints da API (auth, trading, admin, backoffice, afiliados)
  server.js       junta tudo + WebSocket de preços para o frontend

frontend/public/
  client/         interface de trading
  admin/          painel administrativo
  backoffice/     aprovação de saques
  affiliates/     painel de afiliados
```

## O que NÃO está incluído (de propósito)

- **Gateway de pagamento real.** O endpoint `/api/trading/deposit` apenas credita saldo virtual. Para aceitar dinheiro real, você precisa: (1) estrutura jurídica/regulatória adequada na sua jurisdição, (2) integração com um processador de pagamento que aceite esse tipo de negócio.
- **Ativos "OTC" sintéticos.** Todos os preços vêm de mercado real (Binance). Não há gerador de preço artificial.
- **Forex/ações.** A estrutura está pronta para receber outro feed (ex: Twelve Data, Polygon.io), mas só cripto está conectado nesta versão, já que é o único mercado 24/7 nativo.

## Próximos passos sugeridos

1. Trocar as senhas demo (`admin123`, `afiliado123`) imediatamente após o primeiro deploy
2. Adicionar rate limiting nas rotas de auth
3. Avaliar jurisdição e licenciamento antes de conectar dinheiro real
