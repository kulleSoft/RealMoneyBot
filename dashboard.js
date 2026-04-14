// dashboard.js — RealMoney Bot

const STATUS_LABELS = {
  pending:"⏳ Pendente", running:"▶ Rodando",
  ok:"✔ Concluído", error:"✖ Erro", skip:"⏭ Pulado",
};
const STATUS_BADGE = {
  pending:"badge badge-pending", running:"badge badge-running",
  ok:"badge badge-ok", error:"badge badge-error", skip:"badge badge-skip",
};
const LOG_CLS = {
  ok:"log-ok", error:"log-error", warn:"log-warn", skip:"log-skip", info:"log-info",
};

let lastLogLen = 0, allFaucets = [], selectedIdxs = new Set(), filterText = "";

const $  = id => document.getElementById(id);
const emailInput   = $("emailInput");
const btnStart     = $("btnStart");
const btnStop      = $("btnStop");
const filterInput  = $("filterInput");
const statusDot    = $("statusDot");
const statusText   = $("statusText");
const timerDisplay = $("timerDisplay");
const progressFill = $("progressFill");
const faucetTable  = $("faucetTable");
const logBox       = $("logBox");

// Email persistido
chrome.storage.local.get(["email"], ({email}) => { if (email) emailInput.value = email; });
emailInput.addEventListener("change", () => chrome.storage.local.set({email: emailInput.value}));

// Botões toolbar
btnStart.addEventListener("click", () => {
  const raw = emailInput.value.trim();
  const emails = raw
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(Boolean);
  const validEmails = emails.filter(e => e.includes("@"));

  if (!validEmails.length) {
    emailInput.style.borderColor = "#ef4444";
    setTimeout(() => emailInput.style.borderColor = "", 1500);
    return;
  }
  chrome.storage.local.set({email: raw});
  chrome.runtime.sendMessage({type:"START_BOT", emails: validEmails});
});

btnStop.addEventListener("click", () => {
  chrome.runtime.sendMessage({type:"STOP_BOT"});
  btnStop.textContent = "Parando...";
  btnStop.disabled = true;
});

$("btnSelAll").addEventListener("click", () => {
  getVisibleIdxs().forEach(i => selectedIdxs.add(i));
  renderTable();
});

$("btnClearSel").addEventListener("click", () => { selectedIdxs.clear(); renderTable(); });

$("btnOpenSel").addEventListener("click", () => {
  let n = 0;
  for (const idx of selectedIdxs) {
    if (n++ >= 4) break;
    if (allFaucets[idx]) chrome.tabs.create({url: allFaucets[idx].url});
  }
});

filterInput.addEventListener("input", () => {
  filterText = filterInput.value.toLowerCase();
  renderTable();
});

// Botões sidebar
document.querySelectorAll(".qbtn[data-site]").forEach(btn => {
  btn.addEventListener("click", () => {
    allFaucets.filter(f => f.site === btn.dataset.site).slice(0,4)
      .forEach(f => chrome.tabs.create({url: f.url}));
  });
});
document.querySelectorAll(".qbtn[data-coin]").forEach(btn => {
  btn.addEventListener("click", () => {
    allFaucets.filter(f => f.coin === btn.dataset.coin).slice(0,4)
      .forEach(f => chrome.tabs.create({url: f.url}));
  });
});

function getVisibleIdxs() {
  return allFaucets
    .map((f,i) => ({f,i}))
    .filter(({f}) => !filterText || f.coin.toLowerCase().includes(filterText) || f.site.toLowerCase().includes(filterText))
    .map(({i}) => i);
}

function renderTable() {
  faucetTable.innerHTML = getVisibleIdxs().map(idx => {
    const f   = allFaucets[idx];
    const sel = selectedIdxs.has(idx);
    const short = f.url.replace("https://","").replace(/\/$/,"");
    const isCfc = f.site === "claimfreecoins";
    return `<tr class="${sel?"selected":""}" data-idx="${idx}">
      <td><span class="coin">${f.coin}</span></td>
      <td><span class="chip ${isCfc?"chip-cfc":"chip-bee"}">${isCfc?"CFC":"BEE"}</span></td>
      <td class="url-cell" title="${f.url}">${short}</td>
      <td class="col-cell">${f.coletas}/3</td>
      <td><span class="${STATUS_BADGE[f.status]||"badge badge-pending"}">${STATUS_LABELS[f.status]||f.status}</span></td>
    </tr>`;
  }).join("");

  faucetTable.querySelectorAll("tr").forEach(tr => {
    tr.addEventListener("click", () => {
      const idx = parseInt(tr.dataset.idx);
      if (selectedIdxs.has(idx)) selectedIdxs.delete(idx);
      else selectedIdxs.add(idx);
      tr.classList.toggle("selected");
    });
    tr.addEventListener("dblclick", () => {
      const idx = parseInt(tr.dataset.idx);
      if (allFaucets[idx]) chrome.tabs.create({url: allFaucets[idx].url});
    });
  });
}

function renderState(state) {
  if (!state) return;
  allFaucets = state.faucets || [];

  const total = allFaucets.length;
  const ok    = allFaucets.filter(f => f.status==="ok"||f.status==="skip").length;
  const err   = allFaucets.filter(f => f.status==="error").length;
  const pend  = allFaucets.filter(f => f.status==="pending"||f.status==="running").length;
  const done  = ok + err;

  $("sTotal").textContent = total;
  $("sOk").textContent    = ok;
  $("sPend").textContent  = pend;
  $("sErr").textContent   = err;
  progressFill.style.width = total ? `${(done/total)*100}%` : "0%";

  if (state.tempoInicio) {
    const e = Math.floor((Date.now()-state.tempoInicio)/1000);
    timerDisplay.textContent = `${String(Math.floor(e/3600)).padStart(2,"0")}:${String(Math.floor((e%3600)/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`;
  } else { timerDisplay.textContent = "00:00:00"; }

  if (state.rodando) {
    statusDot.className   = "status-dot running";
    statusText.textContent = "Rodando";
    statusText.style.color = "#10b981";
    btnStart.disabled = true; btnStart.classList.add("tbtn-disabled");
    btnStop.disabled  = false; btnStop.textContent = "■ Parar";
    emailInput.disabled = true;
  } else {
    statusDot.className   = "status-dot";
    statusText.textContent = done===total&&total>0 ? "Concluído" : "Aguardando";
    statusText.style.color = "";
    btnStart.disabled = false; btnStart.classList.remove("tbtn-disabled");
    btnStop.disabled  = true;
    emailInput.disabled = false;
  }

  renderTable();

  const entries = state.log || [];
  // Guard robusto: compara length E timestamp/msg da última entrada
  const lastEntry = entries.length ? entries[entries.length-1] : null;
  const lastKey   = entries.length + "|" + (lastEntry ? lastEntry.ts + lastEntry.msg : "");
  if (lastKey !== window._lastLogKey) {
    window._lastLogKey = lastKey;
    lastLogLen = entries.length;
    const atBottom = logBox.scrollHeight - logBox.scrollTop - logBox.clientHeight < 40;
    logBox.innerHTML = entries.slice(-300).map(e =>
      `<div class="log-entry"><span class="log-ts">${e.ts}</span><span class="${LOG_CLS[e.tipo]||"log-info"}">${esc(e.msg)}</span></div>`
    ).join("");
    // Só rolar se já estava no fundo (não interrompe scroll manual do usuário)
    if (atBottom) logBox.scrollTop = logBox.scrollHeight;
  }
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Conexão via porta persistente (mais confiável que sendMessage) ──
let dashPort = null;

function connectPort() {
  try {
    dashPort = chrome.runtime.connect({ name: "dashboard" });
    dashPort.onMessage.addListener(msg => {
      if (msg.type === "STATE_UPDATE") renderState(msg.state);
    });
    dashPort.onDisconnect.addListener(() => {
      dashPort = null;
      // Reconectar após 500ms se a porta cair (SW reiniciou)
      setTimeout(connectPort, 500);
    });
  } catch (e) {
    setTimeout(connectPort, 1000);
  }
}
connectPort();

// Poll de segurança: garante sincronismo mesmo se a porta falhar
// Usa timestamp do último log para detectar trava sem depender de length
let lastLogTs = "";
function poll() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, r => {
    if (chrome.runtime.lastError || !r) return;
    renderState(r);
    // Forçar re-render do log se o timestamp da última entrada mudou
    const entries = r.log || [];
    const latestTs = entries.length ? entries[entries.length - 1].ts : "";
    if (latestTs !== lastLogTs) {
      lastLogTs  = latestTs;
      lastLogLen = -1; // forçar re-render na próxima chamada renderState
    }
  });
}
poll();
setInterval(poll, 2000);

// ── SETTINGS PANEL ──────────────────────────────────────────
const settingsPanel  = document.getElementById("settingsPanel");
const btnSettings    = document.getElementById("btnSettings");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const btnSaveSettings  = document.getElementById("btnSaveSettings");
const spSaved          = document.getElementById("spSaved");

const CFG_FIELDS = ["email","pausaEntre","captchaTimeout","numColetas","notificacoes","navMode"];

// Carregar valores salvos ao abrir o painel
function loadSettings() {
  const keys = CFG_FIELDS.map(f => f);
  chrome.storage.local.get(keys, (data) => {
    CFG_FIELDS.forEach(f => {
      const el = document.getElementById("cfg-" + f);
      if (el && data[f] !== undefined) el.value = data[f];
    });
    // sincroniza email com o campo da toolbar
    if (data.email) emailInput.value = data.email;
  });
}

// Abrir painel
btnSettings.addEventListener("click", () => {
  loadSettings();
  settingsPanel.classList.add("open");
  btnSettings.classList.add("active");
});

// Fechar painel
btnCloseSettings.addEventListener("click", closeSettings);
function closeSettings() {
  settingsPanel.classList.remove("open");
  btnSettings.classList.remove("active");
}

// Salvar
btnSaveSettings.addEventListener("click", () => {
  const data = {};
  CFG_FIELDS.forEach(f => {
    const el = document.getElementById("cfg-" + f);
    if (el) data[f] = el.value;
  });
  chrome.storage.local.set(data, () => {
    // sincroniza email com toolbar imediatamente
    if (data.email) emailInput.value = data.email;
    // propaga navMode para o background
    if (data.navMode) chrome.runtime.sendMessage({ type: "SET_NAV_MODE", mode: data.navMode }).catch(()=>{});
    spSaved.classList.add("show");
    setTimeout(() => spSaved.classList.remove("show"), 2000);
  });
});

// Fechar clicando fora do painel
document.addEventListener("click", (e) => {
  if (settingsPanel.classList.contains("open") &&
      !settingsPanel.contains(e.target) &&
      !btnSettings.contains(e.target)) {
    closeSettings();
  }
});

// ESC fecha o painel
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && settingsPanel.classList.contains("open")) closeSettings();
});

// ── TABS DO SETTINGS PANEL ───────────────────────────────────
const spBodyGeneral  = document.getElementById("spBodyGeneral");
const spBodyFaucets  = document.getElementById("spBodyFaucets");
let faucetEditorInst = null;

document.querySelectorAll(".sp-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".sp-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const which = tab.dataset.tab;
    spBodyGeneral.classList.toggle("sp-body-hidden", which !== "general");
    spBodyFaucets.classList.toggle("sp-body-hidden", which !== "faucets");

    // Inicializar editor na primeira vez que a aba é aberta
    if (which === "faucets" && !faucetEditorInst) {
      faucetEditorInst = new FaucetEditor(document.getElementById("faucetEditorContainer"));
    }
  });
});

// Reabrir editor ao abrir o painel (para refletir mudanças)
const _origLoadSettings = loadSettings;
// Override loadSettings para também resetar aba ativa
const _btnSettingsOrig = btnSettings.onclick;
btnSettings.addEventListener("click", () => {
  // Sempre começa na aba Geral
  document.querySelectorAll(".sp-tab").forEach(t => t.classList.remove("active"));
  document.querySelector(".sp-tab[data-tab='general']").classList.add("active");
  spBodyGeneral.classList.remove("sp-body-hidden");
  spBodyFaucets.classList.add("sp-body-hidden");
  // Refrescar editor se já foi inicializado
  if (faucetEditorInst) {
    faucetEditorInst.init();
  }
});

// ── LICENÇA — status e limpeza ──────────────────────────────
function loadLicenseStatus() {
  const el = document.getElementById("licenseStatus");
  if (!el) return;
  chrome.storage.local.get(["validatedLicense"], (d) => {
    if (d.validatedLicense) {
      el.textContent = "✔ Válida: " + d.validatedLicense;
      el.style.color  = "#16a34a";
      el.style.background = "#f0fdf4";
      el.style.borderColor = "#86efac";
    } else {
      el.textContent = "✖ Sem licença — será solicitada ao iniciar";
      el.style.color  = "#dc2626";
      el.style.background = "#fef2f2";
      el.style.borderColor = "#fca5a5";
    }
  });
}

const btnClearLicense = document.getElementById("btnClearLicense");
if (btnClearLicense) {
  btnClearLicense.addEventListener("click", () => {
    chrome.storage.local.remove("validatedLicense", () => {
      loadLicenseStatus();
    });
  });
}

// Carregar status sempre que o painel abrir
const _origBtnSettings = document.getElementById("btnSettings");
if (_origBtnSettings) {
  _origBtnSettings.addEventListener("click", loadLicenseStatus);
}
loadLicenseStatus();
