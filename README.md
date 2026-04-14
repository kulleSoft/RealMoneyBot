# RealMoney Bot — Extensão do Google Chrome

Bot de automação para claimfreecoins.io e beefaucet.org como extensão do Chrome.

## 📦 Como instalar

1. Abra o Chrome e acesse: `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `cfc-bot-extension`
5. A extensão aparecerá na barra de ferramentas do Chrome ✅

## ⚙️ Como usar

### Popup (ícone na barra)
- Clique no ícone ⬡ na barra do Chrome
- Insira seu **e-mail da conta FaucetPay**
- Clique **▶ Iniciar Bot**
- O bot abrirá automaticamente cada faucet em segundo plano

### Dashboard Completo
- Clique no botão **⛶** no popup para abrir a tela completa
- Veja status detalhado de todos os 40 faucets
- Filtre por moeda ou site
- Selecione faucets para abrir manualmente

### Configurações
- Clique no ícone da extensão > **⚙ Config** (rodapé do popup)
- Configure: e-mail, pausa entre faucets, timeout do captcha, número de coletas

## ⚠️ Importante sobre o CAPTCHA

O reCAPTCHA **precisa ser resolvido manualmente** em cada faucet.
O bot abrirá a aba, preencherá o e-mail e aguardará você resolver o captcha.
Após resolver, o bot detecta automaticamente e continua.

**Dica:** Use a extensão **2captcha** ou resolva manualmente na aba que o bot abre.

## 🗂️ Estrutura de arquivos

```
cfc-bot-extension/
├── manifest.json       # Configuração da extensão
├── background.js       # Service worker — lógica principal do bot
├── content.js          # Injetado nas páginas dos faucets
├── popup.html/.js      # Popup compacto (clique no ícone)
├── dashboard.html/.js  # Dashboard completo (tela cheia)
├── options.html        # Página de configurações
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔄 Diferenças em relação ao script Python original

| Funcionalidade         | Python (Selenium)         | Extensão Chrome              |
|------------------------|---------------------------|------------------------------|
| Automação              | chromedriver externo      | APIs nativas do Chrome       |
| Interface              | CustomTkinter             | HTML/CSS/JS nativo           |
| Perfil do Chrome       | Perfil separado           | Mesmo perfil do usuário      |
| Captcha                | Aguarda iframe fechar     | content.js detecta e notifica |
| Distribuição           | Instalar Python + libs    | Instalar extensão            |

## 🛠️ Permissões usadas

- `storage` — Salvar e-mail e configurações
- `tabs` — Abrir/navegar abas dos faucets
- `scripting` — Injetar scripts para preencher formulários
- `notifications` — Notificar ao concluir
- `alarms` — Temporizadores internos
