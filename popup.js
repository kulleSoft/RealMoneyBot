// popup.js — RealMoney Bot

const STATUS_LABELS = {
  pending:"⏳ Pendente", running:"▶ Rodando",
  ok:"✔ Feito", error:"✖ Erro", skip:"⏭ Pulado",
};
const STATUS_CLASS = {
  pending:"s-pending", running:"s-running",
  ok:"s-ok", error:"s-error", skip:"s-skip",
};

let lastLogLen = 0;
let navMode = "tab"; // "tab" | "same"

// ── Elementos ──────────────────────────────────
const emailInput   = document.getElementById("emailInput");
const btnStart     = document.getElementById("btnStart");
const btnStop      = document.getElementById("btnStop");
const btnDash      = document.getElementById("btnDash");
const btnOpts      = document.getElementById("btnOpts");
const btnCaptcha   = document.getElementById("btnCaptcha");
const statusDot    = document.getElementById("statusDot");
const statusText   = document.getElementById("statusText");
const timerDisplay = document.getElementById("timerDisplay");
const progressFill = document.getElementById("progressFill");
const faucetTable  = document.getElementById("faucetTable");
const logBox       = document.getElementById("logBox");
const modeTab      = document.getElementById("modeTab");
const modeSame     = document.getElementById("modeSame");

// ── Carregar preferências salvas ───────────────
chrome.storage.local.get(["email", "navMode"], (data) => {
  if (data.email)   emailInput.value = data.email;
  if (data.navMode) setNavMode(data.navMode);
});

emailInput.addEventListener("change", () => {
  chrome.storage.local.set({ email: emailInput.value });
});

// ── Toggle modo de navegação ───────────────────
function setNavMode(mode) {
  navMode = mode;
  modeTab.classList.toggle("active",  mode === "tab");
  modeSame.classList.toggle("active", mode === "same");
  // Avisa o background sobre a preferência
  chrome.storage.local.set({ navMode: mode });
  chrome.runtime.sendMessage({ type: "SET_NAV_MODE", mode }).catch(() => {});
}

modeTab.addEventListener("click",  () => setNavMode("tab"));
modeSame.addEventListener("click", () => setNavMode("same"));

async function ensureCaptchaActivated() {
  const data = await chrome.storage.local.get(["settings"]);
  const settings = data.settings || {};
  const patch = {
    ...settings,
    enabled: true,
    recaptcha_auto_open: true,
    recaptcha_auto_solve: true,
  };
  await chrome.storage.local.set({ settings: patch });
  chrome.runtime.sendMessage([
    Math.random().toString(36).slice(2),
    "settings::update",
    patch
  ]).catch(() => {});
}

ensureCaptchaActivated().catch(() => {});

// ── Botão Dashboard ────────────────────────────
btnDash.addEventListener("click", () => {
  const url = chrome.runtime.getURL("dashboard.html");
  if (navMode === "same") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.update(tab.id, { url });
      else     chrome.tabs.create({ url });
    });
  } else {
    chrome.tabs.create({ url });
  }
});

// ── Botão Configurações ─────────────────────── 
btnOpts.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

btnCaptcha.addEventListener("click", () => {
  const url = chrome.runtime.getURL("iacaptchar/popup.html");
  if (navMode === "same") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.update(tab.id, { url });
      else     chrome.tabs.create({ url });
    });
  } else {
    chrome.tabs.create({ url });
  }
});

// ── Iniciar / Parar ────────────────────────────
btnStart.addEventListener("click", () => {
  const raw = emailInput.value.trim();
  const emails = raw
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(Boolean);
  const validEmails = emails.filter(e => e.includes("@"));

  if (!validEmails.length) {
    emailInput.style.borderColor = "#ef4444";
    emailInput.style.boxShadow   = "0 0 0 3px rgba(239,68,68,.15)";
    setTimeout(() => {
      emailInput.style.borderColor = "";
      emailInput.style.boxShadow   = "";
    }, 1500);
    return;
  }
  chrome.storage.local.set({ email: raw });
  btnStart.textContent = "🔑 Validando licença...";
  btnStart.disabled    = true;
  ensureCaptchaActivated().catch(() => {});
  chrome.runtime.sendMessage({ type: "START_BOT", emails: validEmails });
});

btnStop.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP_BOT" });
  btnStop.textContent = "Parando...";
  btnStop.disabled    = true;
});

// ── Links footer ───────────────────────────────
function openUrl(url) {
  if (navMode === "same") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) chrome.tabs.update(tab.id, { url });
      else     chrome.tabs.create({ url });
    });
  } else {
    chrome.tabs.create({ url });
  }
}

document.getElementById("linkCfc").addEventListener("click", () => openUrl("https://claimfreecoins.io"));
document.getElementById("linkBee").addEventListener("click", () => openUrl("https://beefaucet.org"));

// ── Render ─────────────────────────────────────
function renderState(state) {
  if (!state) return;

  const faucets = state.faucets || [];
  const total   = faucets.length;
  const ok      = faucets.filter(f => f.status === "ok" || f.status === "skip").length;
  const err     = faucets.filter(f => f.status === "error").length;
  const pend    = faucets.filter(f => f.status === "pending" || f.status === "running").length;
  const done    = ok + err;

  document.getElementById("sTotal").textContent = total;
  document.getElementById("sOk").textContent    = ok;
  document.getElementById("sPend").textContent  = pend;
  document.getElementById("sErr").textContent   = err;
  progressFill.style.width = total ? `${(done / total) * 100}%` : "0%";

  // Timer
  if (state.tempoInicio) {
    const e = Math.floor((Date.now() - state.tempoInicio) / 1000);
    timerDisplay.textContent =
      `${String(Math.floor(e/3600)).padStart(2,"0")}:${String(Math.floor((e%3600)/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`;
  } else {
    timerDisplay.textContent = "00:00:00";
  }

  // Status
  if (state.rodando) {
    statusDot.className    = "status-dot running";
    statusText.textContent = "Rodando";
    statusText.style.color = "#10b981";
    btnStart.disabled      = true;
    btnStop.disabled       = false;
    btnStop.textContent    = "■ Parar";
    // Se ainda na fase de validação (sem faucets em running/ok/error)
    const anyStarted = (state.faucets||[]).some(f => f.status !== "pending");
    if (!anyStarted) {
      btnStart.textContent = "🔑 Validando licença...";
    } else {
      btnStart.textContent = "▶ Iniciando...";
    }
    emailInput.disabled    = true;
    modeTab.disabled       = true;
    modeSame.disabled      = true;
  } else {
    statusDot.className    = "status-dot";
    statusText.textContent = done === total && total > 0 ? "Concluído" : "Aguardando";
    statusText.style.color = "";
    btnStart.disabled      = false;
    btnStop.disabled       = true;
    emailInput.disabled    = false;
    modeTab.disabled       = false;
    modeSame.disabled      = false;
  }

  // Tabela
  faucetTable.innerHTML = faucets.map(f => {
    const sc = f.site === "claimfreecoins" ? "cfc" : "bee";
    const sl = f.site === "claimfreecoins" ? "CFC" : "BEE";
    return `<tr>
      <td><span class="coin-badge">${f.coin}</span></td>
      <td><span class="site-chip ${sc}">${sl}</span></td>
      <td style="color:#94a3b8;font-family:'JetBrains Mono',monospace">${f.coletas}/3</td>
      <td><span class="status-text ${STATUS_CLASS[f.status]||''}">${STATUS_LABELS[f.status]||f.status}</span></td>
    </tr>`;
  }).join("");

  // Log — guard robusto por key (length + último timestamp + msg)
  const entries = state.log || [];
  const lastEntry = entries.length ? entries[entries.length-1] : null;
  const logKey = entries.length + "|" + (lastEntry ? lastEntry.ts + lastEntry.msg : "");
  if (logKey !== window._lastPopupLogKey) {
    window._lastPopupLogKey = logKey;
    lastLogLen = entries.length;
    const atBottom = logBox.scrollHeight - logBox.scrollTop - logBox.clientHeight < 40;
    logBox.innerHTML = entries.slice(-80).map(e =>
      `<div class="log-entry">
        <span class="log-ts">${e.ts}</span>
        <span class="log-msg ${e.tipo||'info'}">${esc(e.msg)}</span>
      </div>`
    ).join("");
    if (atBottom) logBox.scrollTop = logBox.scrollHeight;
  }
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Polling ────────────────────────────────────
// ── Porta persistente (evita travamento quando SW dorme) ──
let popupPort = null;
function connectPort() {
  try {
    popupPort = chrome.runtime.connect({ name: "popup" });
    popupPort.onMessage.addListener(msg => {
      if (msg.type === "STATE_UPDATE") renderState(msg.state);
    });
    popupPort.onDisconnect.addListener(() => {
      popupPort = null;
      setTimeout(connectPort, 500);
    });
  } catch { setTimeout(connectPort, 1000); }
}
connectPort();

// Poll de segurança a cada 2s — detecta trava pelo timestamp do último log
let _lastPopupLogTs = "";
function poll() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (r) => {
    if (chrome.runtime.lastError || !r) return;
    renderState(r);
    const entries = r.log || [];
    const ts = entries.length ? entries[entries.length-1].ts : "";
    if (ts !== _lastPopupLogTs) { _lastPopupLogTs = ts; lastLogLen = -1; }
  });
}
poll();
setInterval(poll, 2000);
