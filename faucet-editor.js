// ─────────────────────────────────────────────
// FAUCET EDITOR — RealMoney Bot by KulleSoft
// Gerencia lista customizada de faucets no storage
// ─────────────────────────────────────────────

const DEFAULT_FAUCETS = [
  { coin:"BTC",  url:"https://claimfreecoins.io/bitcoin-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"ETH",  url:"https://claimfreecoins.io/ethereum-faucet/",  site:"claimfreecoins", enabled:true },
  { coin:"USDT", url:"https://claimfreecoins.io/tether-faucet/",    site:"claimfreecoins", enabled:true },
  { coin:"BNB",  url:"https://claimfreecoins.io/bnb-faucet/",       site:"claimfreecoins", enabled:true },
  { coin:"SOL",  url:"https://claimfreecoins.io/solana-faucet/",    site:"claimfreecoins", enabled:true },
  { coin:"USDC", url:"https://claimfreecoins.io/usdc-faucet/",      site:"claimfreecoins", enabled:true },
  { coin:"XRP",  url:"https://claimfreecoins.io/ripple-faucet/",    site:"claimfreecoins", enabled:true },
  { coin:"DOGE", url:"https://claimfreecoins.io/dogecoin-faucet/",  site:"claimfreecoins", enabled:true },
  { coin:"TRX",  url:"https://claimfreecoins.io/tron-faucet/",      site:"claimfreecoins", enabled:true },
  { coin:"TON",  url:"https://claimfreecoins.io/toncoin-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"BCH",  url:"https://claimfreecoins.io/bch-faucet/",       site:"claimfreecoins", enabled:true },
  { coin:"ADA",  url:"https://claimfreecoins.io/cardano-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"LTC",  url:"https://claimfreecoins.io/litecoin-faucet/",  site:"claimfreecoins", enabled:true },
  { coin:"POL",  url:"https://claimfreecoins.io/polygon-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"XMR",  url:"https://claimfreecoins.io/monero-faucet/",    site:"claimfreecoins", enabled:true },
  { coin:"XLM",  url:"https://claimfreecoins.io/stellar-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"ZEC",  url:"https://claimfreecoins.io/zcash-faucet/",     site:"claimfreecoins", enabled:true },
  { coin:"DASH", url:"https://claimfreecoins.io/dash-faucet/",      site:"claimfreecoins", enabled:true },
  { coin:"DGB",  url:"https://claimfreecoins.io/digibyte-faucet/",  site:"claimfreecoins", enabled:true },
  { coin:"FEY",  url:"https://claimfreecoins.io/feyorra-faucet/",   site:"claimfreecoins", enabled:true },
  { coin:"BTC",  url:"https://beefaucet.org/btc-faucet/",           site:"beefaucet", enabled:true },
  { coin:"ETH",  url:"https://beefaucet.org/eth-faucet/",           site:"beefaucet", enabled:true },
  { coin:"USDT", url:"https://beefaucet.org/usdt-faucet/",          site:"beefaucet", enabled:true },
  { coin:"BNB",  url:"https://beefaucet.org/bnb-faucet/",           site:"beefaucet", enabled:true },
  { coin:"SOL",  url:"https://beefaucet.org/sol-faucet/",           site:"beefaucet", enabled:true },
  { coin:"USDC", url:"https://beefaucet.org/usdc-faucet/",          site:"beefaucet", enabled:true },
  { coin:"XRP",  url:"https://beefaucet.org/xrp-faucet/",           site:"beefaucet", enabled:true },
  { coin:"DOGE", url:"https://beefaucet.org/doge-faucet/",          site:"beefaucet", enabled:true },
  { coin:"TRX",  url:"https://beefaucet.org/trx-faucet/",           site:"beefaucet", enabled:true },
  { coin:"TON",  url:"https://beefaucet.org/ton-faucet/",           site:"beefaucet", enabled:true },
  { coin:"BCH",  url:"https://beefaucet.org/bch-faucet/",           site:"beefaucet", enabled:true },
  { coin:"ADA",  url:"https://beefaucet.org/ada-faucet/",           site:"beefaucet", enabled:true },
  { coin:"LTC",  url:"https://beefaucet.org/ltc-faucet/",           site:"beefaucet", enabled:true },
  { coin:"POL",  url:"https://beefaucet.org/matic-faucet/",         site:"beefaucet", enabled:true },
  { coin:"XMR",  url:"https://beefaucet.org/xmr-faucet/",           site:"beefaucet", enabled:true },
  { coin:"XLM",  url:"https://beefaucet.org/xlm-faucet/",           site:"beefaucet", enabled:true },
  { coin:"ZEC",  url:"https://beefaucet.org/zec-faucet/",           site:"beefaucet", enabled:true },
  { coin:"DASH", url:"https://beefaucet.org/dash-faucet/",          site:"beefaucet", enabled:true },
  { coin:"DGB",  url:"https://beefaucet.org/dgb-faucet/",           site:"beefaucet", enabled:true },
  { coin:"FEY",  url:"https://beefaucet.org/fey-faucet/",           site:"beefaucet", enabled:true },
];

// ── API pública ───────────────────────────────
async function loadFaucets() {
  return new Promise(resolve => {
    chrome.storage.local.get(["customFaucets"], (d) => {
      resolve(d.customFaucets || DEFAULT_FAUCETS);
    });
  });
}

async function saveFaucets(list) {
  return new Promise(resolve => {
    chrome.storage.local.set({ customFaucets: list }, resolve);
  });
}

async function resetFaucets() {
  await saveFaucets(DEFAULT_FAUCETS);
  return DEFAULT_FAUCETS;
}

// ── EDITOR UI ────────────────────────────────
// Renderiza dentro de um container passado como parâmetro
class FaucetEditor {
  constructor(container) {
    this.container = container;
    this.faucets   = [];
    this.filter    = "";
    this.init();
  }

  async init() {
    this.faucets = await loadFaucets();
    this.render();
  }

  esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  siteOf(url) {
    if (url.includes("claimfreecoins.io")) return "claimfreecoins";
    if (url.includes("beefaucet.org"))     return "beefaucet";
    return url.split("/")[2] || "custom";
  }

  render() {
    const q    = this.filter.toLowerCase();
    const list = this.faucets.filter(f =>
      !q || f.coin.toLowerCase().includes(q) || f.url.toLowerCase().includes(q) || f.site.toLowerCase().includes(q)
    );
    const enabled  = this.faucets.filter(f => f.enabled).length;
    const disabled = this.faucets.length - enabled;

    this.container.innerHTML = `
<style>
.fe-wrap{font-family:'Inter',system-ui,sans-serif;font-size:12px;color:#0f172a}
.fe-topbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.fe-search{flex:1;min-width:120px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:6px 10px;font-size:11px;color:#0f172a;outline:none;transition:border .2s}
.fe-search:focus{border-color:#C89500;box-shadow:0 0 0 3px rgba(200,149,0,.1)}
.fe-stats{font-size:10px;color:#94a3b8;white-space:nowrap}
.fe-stats b{color:#0f172a}
.fe-btn{height:28px;padding:0 10px;border-radius:7px;border:1px solid;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;white-space:nowrap}
.fe-btn-green{background:#f0fdf4;border-color:#86efac;color:#16a34a}
.fe-btn-green:hover{background:#dcfce7}
.fe-btn-slate{background:#f8fafc;border-color:#e2e8f0;color:#475569}
.fe-btn-slate:hover{background:#f1f5f9}
.fe-btn-red{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
.fe-btn-red:hover{background:#fee2e2}

/* List */
.fe-list{display:flex;flex-direction:column;gap:4px;max-height:320px;overflow-y:auto;padding-right:2px}
.fe-list::-webkit-scrollbar{width:4px}
.fe-list::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
.fe-row{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #f1f5f9;border-radius:9px;transition:border .15s,box-shadow .1s}
.fe-row:hover{border-color:#e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.fe-row.disabled-row{opacity:.45}
.fe-toggle{position:relative;width:32px;height:18px;flex-shrink:0;cursor:pointer}
.fe-toggle input{opacity:0;width:0;height:0;position:absolute}
.fe-slider{position:absolute;inset:0;border-radius:99px;background:#e2e8f0;transition:background .2s}
.fe-slider::before{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:2px;left:2px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.fe-toggle input:checked + .fe-slider{background:#16a34a}
.fe-toggle input:checked + .fe-slider::before{transform:translateX(14px)}
.fe-coin{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px;color:#0f172a;width:38px;flex-shrink:0}
.fe-chip{display:inline-block;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:.3px;flex-shrink:0}
.fe-chip-cfc{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe}
.fe-chip-bee{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
.fe-chip-custom{background:#f0fdf4;color:#16a34a;border:1px solid #86efac}
.fe-url{font-family:'JetBrains Mono',monospace;font-size:10px;color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.fe-url:hover{color:#C89500}
.fe-icon-btn{width:24px;height:24px;border:none;background:transparent;cursor:pointer;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#94a3b8;transition:all .15s;flex-shrink:0}
.fe-icon-btn:hover{background:#fef2f2;color:#dc2626}

/* Add form */
.fe-add-form{margin-top:12px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px}
.fe-add-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#94a3b8;margin-bottom:10px}
.fe-add-row{display:flex;gap:6px;flex-wrap:wrap}
.fe-add-input{flex:1;min-width:80px;background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:7px 10px;font-size:11px;color:#0f172a;outline:none;font-family:'JetBrains Mono',monospace;transition:border .2s}
.fe-add-input:focus{border-color:#C89500;box-shadow:0 0 0 3px rgba(200,149,0,.1)}
.fe-add-input::placeholder{color:#cbd5e1;font-family:'Inter',sans-serif}
.fe-add-btn{height:32px;padding:0 14px;border-radius:7px;border:1px solid #86efac;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;white-space:nowrap}
.fe-add-btn:hover{background:#dcfce7}
.fe-err{font-size:10px;color:#dc2626;margin-top:6px;display:none}
.fe-err.show{display:block}
.fe-empty{text-align:center;padding:24px;color:#94a3b8;font-size:11px}
</style>

<div class="fe-wrap">
  <!-- Topbar do editor -->
  <div class="fe-topbar">
    <input class="fe-search" id="feSearch" placeholder="🔍  Filtrar faucets..." value="${this.esc(this.filter)}">
    <span class="fe-stats"><b>${enabled}</b> ativos · <b>${disabled}</b> inativos · <b>${this.faucets.length}</b> total</span>
    <button class="fe-btn fe-btn-slate" id="feToggleAll" title="Ativar/desativar todos visíveis">⬤ Tudo</button>
    <button class="fe-btn fe-btn-red"   id="feReset"    title="Restaurar lista padrão">↺ Padrão</button>
  </div>

  <!-- Lista -->
  <div class="fe-list" id="feList">
    ${list.length === 0 ? `<div class="fe-empty">Nenhum faucet encontrado</div>` :
      list.map((f, vi) => {
        const realIdx = this.faucets.indexOf(f);
        const short   = f.url.replace("https://","").replace(/\/$/,"");
        const site    = f.site || this.siteOf(f.url);
        const chipCls = site === "claimfreecoins" ? "fe-chip-cfc" : site === "beefaucet" ? "fe-chip-bee" : "fe-chip-custom";
        const chipLbl = site === "claimfreecoins" ? "CFC" : site === "beefaucet" ? "BEE" : "URL";
        return `
        <div class="fe-row ${f.enabled ? "" : "disabled-row"}" data-idx="${realIdx}">
          <label class="fe-toggle" title="${f.enabled ? "Desativar" : "Ativar"}">
            <input type="checkbox" ${f.enabled ? "checked" : ""} data-toggle="${realIdx}">
            <span class="fe-slider"></span>
          </label>
          <span class="fe-coin">${this.esc(f.coin)}</span>
          <span class="fe-chip ${chipCls}">${chipLbl}</span>
          <span class="fe-url" title="${this.esc(f.url)}" data-open="${realIdx}">${this.esc(short)}</span>
          <button class="fe-icon-btn" data-del="${realIdx}" title="Remover faucet">✕</button>
        </div>`;
      }).join("")
    }
  </div>

  <!-- Formulário adicionar -->
  <div class="fe-add-form">
    <div class="fe-add-title">➕ Adicionar novo faucet</div>
    <div class="fe-add-row">
      <input class="fe-add-input" id="feNewCoin" placeholder="Moeda (ex: BTC)" maxlength="10">
      <input class="fe-add-input" id="feNewUrl"  placeholder="https://site.com/faucet/" style="flex:3">
      <button class="fe-add-btn" id="feAddBtn">Adicionar</button>
    </div>
    <div class="fe-err" id="feErr"></div>
  </div>
</div>`;

    // ── Eventos ──────────────────────────────
    // Busca
    this.container.querySelector("#feSearch").addEventListener("input", (e) => {
      this.filter = e.target.value;
      this.render();
    });

    // Toggles individuais
    this.container.querySelectorAll("[data-toggle]").forEach(cb => {
      cb.addEventListener("change", async () => {
        const idx = parseInt(cb.dataset.toggle);
        this.faucets[idx].enabled = cb.checked;
        await saveFaucets(this.faucets);
        this.render();
        this.notifyBackground();
      });
    });

    // Abrir URL no clique
    this.container.querySelectorAll("[data-open]").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.open);
        chrome.tabs.create({ url: this.faucets[idx].url });
      });
    });

    // Deletar
    this.container.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.del);
        const f   = this.faucets[idx];
        if (!confirm(`Remover ${f.coin} — ${f.url}?`)) return;
        this.faucets.splice(idx, 1);
        await saveFaucets(this.faucets);
        this.render();
        this.notifyBackground();
      });
    });

    // Toggle todos visíveis
    this.container.querySelector("#feToggleAll").addEventListener("click", async () => {
      const q    = this.filter.toLowerCase();
      const vis  = this.faucets.filter(f =>
        !q || f.coin.toLowerCase().includes(q) || f.url.toLowerCase().includes(q)
      );
      const allOn = vis.every(f => f.enabled);
      vis.forEach(f => { f.enabled = !allOn; });
      await saveFaucets(this.faucets);
      this.render();
      this.notifyBackground();
    });

    // Reset
    this.container.querySelector("#feReset").addEventListener("click", async () => {
      if (!confirm("Restaurar a lista padrão? Faucets customizados serão perdidos.")) return;
      this.faucets = await resetFaucets();
      this.filter  = "";
      this.render();
      this.notifyBackground();
    });

    // Adicionar novo
    this.container.querySelector("#feAddBtn").addEventListener("click", async () => {
      const coinEl = this.container.querySelector("#feNewCoin");
      const urlEl  = this.container.querySelector("#feNewUrl");
      const errEl  = this.container.querySelector("#feErr");
      const coin   = coinEl.value.trim().toUpperCase();
      const url    = urlEl.value.trim();

      errEl.classList.remove("show");

      if (!coin) { errEl.textContent = "Informe o nome da moeda."; errEl.classList.add("show"); return; }
      if (!url || !url.startsWith("http")) { errEl.textContent = "URL inválida — deve começar com http(s)://"; errEl.classList.add("show"); return; }
      if (this.faucets.some(f => f.url === url)) { errEl.textContent = "Este URL já existe na lista."; errEl.classList.add("show"); return; }

      const site = this.siteOf(url);
      this.faucets.push({ coin, url, site, enabled: true });
      await saveFaucets(this.faucets);
      coinEl.value = "";
      urlEl.value  = "";
      this.render();
      this.notifyBackground();
    });

    // Enter no campo URL adiciona
    this.container.querySelector("#feNewUrl").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.container.querySelector("#feAddBtn").click();
    });
  }

  // Avisa o background para recarregar a lista de faucets
  notifyBackground() {
    chrome.runtime.sendMessage({ type: "RELOAD_FAUCETS" }).catch(() => {});
  }
}

// Exportar para uso no dashboard.js
window.FaucetEditor = FaucetEditor;
window.loadFaucets  = loadFaucets;
