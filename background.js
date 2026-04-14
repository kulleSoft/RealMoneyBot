// ─────────────────────────────────────────────
// BACKGROUND SERVICE WORKER — RealMoney Bot
// Polling ATIVO: background consulta a página a cada 10s
// Não depende de mensagens do content.js para desbloquear
// ─────────────────────────────────────────────

importScripts(chrome.runtime.getURL("iacaptchar/background.js"));

const FAUCETS = [
  { coin: "BTC",  url: "https://claimfreecoins.io/bitcoin-faucet/",   site: "claimfreecoins" },
  { coin: "ETH",  url: "https://claimfreecoins.io/ethereum-faucet/",  site: "claimfreecoins" },
  { coin: "USDT", url: "https://claimfreecoins.io/tether-faucet/",    site: "claimfreecoins" },
  { coin: "BNB",  url: "https://claimfreecoins.io/bnb-faucet/",       site: "claimfreecoins" },
  { coin: "SOL",  url: "https://claimfreecoins.io/solana-faucet/",    site: "claimfreecoins" },
  { coin: "USDC", url: "https://claimfreecoins.io/usdc-faucet/",      site: "claimfreecoins" },
  { coin: "XRP",  url: "https://claimfreecoins.io/ripple-faucet/",    site: "claimfreecoins" },
  { coin: "DOGE", url: "https://claimfreecoins.io/dogecoin-faucet/",  site: "claimfreecoins" },
  { coin: "TRX",  url: "https://claimfreecoins.io/tron-faucet/",      site: "claimfreecoins" },
  { coin: "TON",  url: "https://claimfreecoins.io/toncoin-faucet/",   site: "claimfreecoins" },
  { coin: "BCH",  url: "https://claimfreecoins.io/bch-faucet/",       site: "claimfreecoins" },
  { coin: "ADA",  url: "https://claimfreecoins.io/cardano-faucet/",   site: "claimfreecoins" },
  { coin: "LTC",  url: "https://claimfreecoins.io/litecoin-faucet/",  site: "claimfreecoins" },
  { coin: "POL",  url: "https://claimfreecoins.io/polygon-faucet/",   site: "claimfreecoins" },
  { coin: "XMR",  url: "https://claimfreecoins.io/monero-faucet/",    site: "claimfreecoins" },
  { coin: "XLM",  url: "https://claimfreecoins.io/stellar-faucet/",   site: "claimfreecoins" },
  { coin: "ZEC",  url: "https://claimfreecoins.io/zcash-faucet/",     site: "claimfreecoins" },
  { coin: "DASH", url: "https://claimfreecoins.io/dash-faucet/",      site: "claimfreecoins" },
  { coin: "DGB",  url: "https://claimfreecoins.io/digibyte-faucet/",  site: "claimfreecoins" },
  { coin: "FEY",  url: "https://claimfreecoins.io/feyorra-faucet/",   site: "claimfreecoins" },
  { coin: "BTC",  url: "https://beefaucet.org/btc-faucet/",           site: "beefaucet" },
  { coin: "ETH",  url: "https://beefaucet.org/eth-faucet/",           site: "beefaucet" },
  { coin: "USDT", url: "https://beefaucet.org/usdt-faucet/",          site: "beefaucet" },
  { coin: "BNB",  url: "https://beefaucet.org/bnb-faucet/",           site: "beefaucet" },
  { coin: "SOL",  url: "https://beefaucet.org/sol-faucet/",           site: "beefaucet" },
  { coin: "USDC", url: "https://beefaucet.org/usdc-faucet/",          site: "beefaucet" },
  { coin: "XRP",  url: "https://beefaucet.org/xrp-faucet/",           site: "beefaucet" },
  { coin: "DOGE", url: "https://beefaucet.org/doge-faucet/",          site: "beefaucet" },
  { coin: "TRX",  url: "https://beefaucet.org/trx-faucet/",           site: "beefaucet" },
  { coin: "TON",  url: "https://beefaucet.org/ton-faucet/",           site: "beefaucet" },
  { coin: "BCH",  url: "https://beefaucet.org/bch-faucet/",           site: "beefaucet" },
  { coin: "ADA",  url: "https://beefaucet.org/ada-faucet/",           site: "beefaucet" },
  { coin: "LTC",  url: "https://beefaucet.org/ltc-faucet/",           site: "beefaucet" },
  { coin: "POL",  url: "https://beefaucet.org/matic-faucet/",         site: "beefaucet" },
  { coin: "XMR",  url: "https://beefaucet.org/xmr-faucet/",           site: "beefaucet" },
  { coin: "XLM",  url: "https://beefaucet.org/xlm-faucet/",           site: "beefaucet" },
  { coin: "ZEC",  url: "https://beefaucet.org/zec-faucet/",           site: "beefaucet" },
  { coin: "DASH", url: "https://beefaucet.org/dash-faucet/",          site: "beefaucet" },
  { coin: "DGB",  url: "https://beefaucet.org/dgb-faucet/",           site: "beefaucet" },
  { coin: "FEY",  url: "https://beefaucet.org/fey-faucet/",           site: "beefaucet" },
];

const DAILY_LIMIT_TEXT  = "Your daily claim limit has been reached";
const PAUSA_ENTRE       = 8000;   // ms entre faucets
const POLL_INTERVAL_MS  = 10000;  // verificar captcha a cada 10s
const POLL_MAX_CHECKS   = 12;     // 12 × 10s = 120s máximo
const MAX_RETRIES       = 2;      // reinícios por coleta se timeout

async function activateCaptchaSolver() {
  const data = await chrome.storage.local.get(["settings"]);
  const settings = data.settings || {};
  const patch = {
    ...settings,
    enabled: true,
    recaptcha_auto_open: true,
    recaptcha_auto_solve: true,
  };
  await chrome.storage.local.set({ settings: patch });
  try {
    await chrome.runtime.sendMessage([
      Math.random().toString(36).slice(2),
      "settings::update",
      patch
    ]);
  } catch {}
}

// ─── Carregar preferência de navegação salva ────
chrome.storage.local.get(["navMode"], (data) => {
  if (data.navMode) navMode = data.navMode;
});

activateCaptchaSolver().catch(() => {});

// ─── Keepalive: evita que o service worker durma durante o bot ────
chrome.alarms.create("keepalive", { periodInMinutes: 0.4 }); // a cada 24s
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive" && botState.rodando) {
    broadcastState(); // mantém o SW ativo e sincroniza clientes
  }
});

// ─── Estado ──────────────────────────────────
let botState = {
  rodando: false, parar: false, tempoInicio: null,
  faucetIdx: 0, log: [],
  faucets: FAUCETS.map(f => ({ ...f, status: "pending", coletas: 0, mensagem: "" })),
};
let botTabId = null;
let navMode  = 'tab'; // 'tab' | 'same' — preferência do usuário
let lastCaptchaSolverStep = 0;

// ─── Helpers ──────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function updateFaucet(idx, data) {
  Object.assign(botState.faucets[idx], data);
  broadcastState();
}

let _broadcastPending = false;
function addLog(msg, tipo = "info") {
  const ts = new Date().toLocaleTimeString("pt-BR");
  botState.log.push({ ts, msg, tipo });
  if (botState.log.length > 500) botState.log = botState.log.slice(-500);
  // Throttle: agrupa broadcasts em rajadas para não sobrecarregar a mensageria
  if (!_broadcastPending) {
    _broadcastPending = true;
    setTimeout(() => { _broadcastPending = false; broadcastState(); }, 150);
  }
}

// Portas conectadas (popup/dashboard abertas)
const connectedPorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  connectedPorts.add(port);
  // Enviar estado imediato ao conectar
  try { port.postMessage({ type: "STATE_UPDATE", state: getPublicState() }); } catch {}
  port.onDisconnect.addListener(() => connectedPorts.delete(port));
});

function broadcastState() {
  const state = getPublicState();
  // Enviar via portas persistentes (mais confiável — mantém SW vivo)
  for (const port of connectedPorts) {
    try { port.postMessage({ type: "STATE_UPDATE", state }); } catch { connectedPorts.delete(port); }
  }
  // Fallback via sendMessage para contextos sem porta (ex: content scripts)
  chrome.runtime.sendMessage({ type: "STATE_UPDATE", state }).catch(() => {});
}

function getPublicState() {
  return {
    rodando: botState.rodando, parar: botState.parar,
    tempoInicio: botState.tempoInicio, faucetIdx: botState.faucetIdx,
    log: botState.log.slice(-300), faucets: botState.faucets,
  };
}

// ─── Mensagens do popup/dashboard ────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATE")  { sendResponse(getPublicState()); }
  if (msg.type === "START_BOT")  {
    if (!botState.rodando) {
      activateCaptchaSolver()
        .then(() => addLog("🧩 Solver de captcha ativado com sucesso.", "ok"))
        .catch(() => addLog("⚠️ Não foi possível confirmar a ativação do solver de captcha.", "warn"))
        .finally(() => startBot(msg.email));
    }
    sendResponse({ ok: true });
  }
  if (msg.type === "STOP_BOT")   { botState.parar = true; addLog("Parada solicitada...", "warn"); sendResponse({ ok: true }); }
  if (msg.type === "CAPTCHA_SOLVER_STEP") {
    const step = Number(msg?.detail?.count || 0);
    if (step > lastCaptchaSolverStep) {
      lastCaptchaSolverStep = step;
      addLog(`🧩 Solver captcha em execução (passo ${step}).`, "info");
    }
    sendResponse({ ok: true });
  }
  if (msg.type === "RESET")      { resetState(); sendResponse({ ok: true }); }
  if (msg.type === "RELOAD_FAUCETS") {
    // Recarregar lista customizada de faucets do storage
    chrome.storage.local.get(["customFaucets"], (d) => {
      if (d.customFaucets && d.customFaucets.length > 0) {
        const active = d.customFaucets.filter(f => f.enabled !== false);
        botState.faucets = active.map(f => ({
          ...f, status:"pending", coletas:0, mensagem:""
        }));
        broadcastState();
      }
    });
    sendResponse({ ok: true });
  }
  if (msg.type === "SET_NAV_MODE") {
    navMode = msg.mode || "tab";
    chrome.storage.local.set({ navMode });
    sendResponse({ ok: true });
  }
  return true;
});

function resetState() {
  botState.faucets = FAUCETS.map(f => ({ ...f, status: "pending", coletas: 0, mensagem: "" }));
  botState.log = []; botState.parar = false; botState.rodando = false;
  botState.tempoInicio = null; botState.faucetIdx = 0;
  lastCaptchaSolverStep = 0;
  broadcastState();
}

// ─── Navegar respeitando preferência do usuário ─
async function navegarPara(url) {
  if (navMode === "same") {
    // MESMA GUIA: reutiliza sempre a aba registrada ou a ativa
    if (botTabId !== null) {
      try {
        await chrome.tabs.update(botTabId, { url });
        await waitForTabLoad(botTabId);
        return botTabId;
      } catch { botTabId = null; }
    }
    // Captura a aba ativa atual na primeira vez
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        botTabId = activeTab.id;
        await chrome.tabs.update(botTabId, { url });
        await waitForTabLoad(botTabId);
        return botTabId;
      }
    } catch {}
    // fallback mesma guia
    const tab = await chrome.tabs.create({ url, active: true });
    botTabId = tab.id;
    await waitForTabLoad(botTabId);
    return botTabId;

  } else {
    // NOVA GUIA: sempre abre uma guia nova para cada faucet
    // Fecha a anterior se existir para não acumular abas
    if (botTabId !== null) {
      try { await chrome.tabs.remove(botTabId); } catch {}
      botTabId = null;
    }
    const tab = await chrome.tabs.create({ url, active: true });
    botTabId = tab.id;
    await waitForTabLoad(botTabId);
    return botTabId;
  }
}

// Aguarda a aba terminar de carregar (evento onUpdated)
function waitForTabLoad(tabId, timeout = 15000) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ─── Injetar função na aba ────────────────────
async function injetar(tabId, func, args = []) {
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, func, args });
    return r?.[0]?.result ?? null;
  } catch (e) {
    return null;
  }
}

// ─── Verificar estado da página (chamada pelo background) ──
// Retorna: "daily_limit" | "success" | "captcha_open" | "captcha_closed" | "unknown"
async function verificarPagina(tabId, prevCaptchaOpen) {
  return await injetar(tabId, (limitText, wasCaptchaOpen) => {
    // 1. Limite diário
    const dangers = [...document.querySelectorAll(".alert-danger, .alert.alert-danger")];
    for (const el of dangers) {
      if (el.textContent.includes(limitText)) return "daily_limit";
    }

    // 2. Sucesso
    const successes = [...document.querySelectorAll(".alert-success, .alert.alert-success")];
    for (const el of successes) {
      if (el.textContent.trim().length > 5) return "success";
    }

    // 3. Token reCAPTCHA preenchido
    const token = document.querySelector("textarea[name='g-recaptcha-response']");
    if (token && token.value && token.value.length > 20) return "captcha_resolved_token";

    // 4. Iframe challenge do reCAPTCHA
    const challengeFrame = document.querySelector(
      "iframe[title*='recaptcha challenge'], iframe[src*='recaptcha'][src*='bframe']"
    );
    const isCaptchaOpen = !!(challengeFrame && challengeFrame.offsetParent !== null);

    if (isCaptchaOpen) return "captcha_open";
    if (wasCaptchaOpen && !isCaptchaOpen) return "captcha_closed"; // acabou de fechar = resolvido

    // 5. Modal captcha ainda visível (sem iframe do challenge = não resolvido ainda)
    const modal = document.querySelector("#captchaModal.show, .modal.show #g-recaptcha");
    if (modal) return "waiting_user";

    return "unknown";
  }, [DAILY_LIMIT_TEXT, prevCaptchaOpen]);
}

// ─── POLLING ATIVO DO CAPTCHA ─────────────────
// O background injeta verificarPagina() a cada 10s diretamente.
// Não depende de nenhuma mensagem vinda do content.js.
async function aguardarCaptcha(tabId, logPrefix) {
  let checks = 0;
  let captchaWasOpen = false;

  addLog(`${logPrefix}Verificando captcha a cada 10s (máx 120s)...`, "warn");

  while (checks < POLL_MAX_CHECKS) {
    if (botState.parar) return "parado";

    await sleep(POLL_INTERVAL_MS);
    checks++;

    const elapsed = checks * 10;
    const estado = await verificarPagina(tabId, captchaWasOpen);

    addLog(`${logPrefix}[${elapsed}s] Estado: ${estado}`, "info");

    if (estado === "daily_limit")          return "daily_limit";
    if (estado === "success")              return "success";
    if (estado === "captcha_resolved_token") {
      addLog(`${logPrefix}✅ Captcha resolvido (token detectado). Solver em funcionamento.`, "ok");
      return "resolved";
    }
    if (estado === "captcha_closed") {
      addLog(`${logPrefix}✅ Captcha resolvido (challenge fechado). Solver em funcionamento.`, "ok");
      return "resolved";
    }

    if (estado === "captcha_open") {
      captchaWasOpen = true;
      if (lastCaptchaSolverStep === 0 && elapsed >= 30) {
        addLog(`${logPrefix}[${elapsed}s] Solver sem atividade detectada. Verifique se a extensão de captcha foi recarregada.`, "warn");
      }
      addLog(`${logPrefix}[${elapsed}s] reCAPTCHA aberto — aguardando o usuário resolver...`, "warn");
      continue;
    }

    // "unknown" ou "waiting_user" — continua aguardando
    addLog(`${logPrefix}[${elapsed}s] Aguardando interação... (${POLL_MAX_CHECKS - checks} checks restantes)`, "info");
  }

  return "timeout";
}

// ─── PROCESSAR UM FAUCET ──────────────────────
async function processarFaucet(idx, faucet, email) {
  updateFaucet(idx, { status: "running", mensagem: "Iniciando..." });
  addLog(`  [${faucet.coin}·${faucet.site === "claimfreecoins" ? "CFC" : "BEE"}] ${faucet.url}`, "info");

  let sucessos = 0;

  for (let coleta = 1; coleta <= 3; coleta++) {
    if (botState.parar) { updateFaucet(idx, { status: "skip", mensagem: "Interrompido" }); return false; }

    updateFaucet(idx, { coletas: coleta, mensagem: `Coleta ${coleta}/3` });
    addLog(`  ▶ Coleta ${coleta}/3`, "info");

    let tentativa = 0;
    let coletaOk  = false;

    while (tentativa <= MAX_RETRIES && !coletaOk) {
      if (botState.parar) break;

      const prefix = `    [T${tentativa + 1}] `;

      if (tentativa > 0) {
        addLog(`${prefix}↺ Reiniciando página...`, "warn");
        updateFaucet(idx, { mensagem: `Coleta ${coleta} — retry ${tentativa}` });
      }

      try {
        // 1. Navegar
        addLog(`${prefix}Abrindo página...`, "info");
        const tabId = await navegarPara(faucet.url);
        await sleep(3000); // aguarda JS da página estabilizar

        // 2. Verificação rápida pós-carregamento (limite diário / sucesso imediato)
        const estadoInicial = await verificarPagina(tabId, false);
        if (estadoInicial === "daily_limit") {
          addLog(`${prefix}⏭ Limite diário — pulando faucet`, "skip");
          updateFaucet(idx, { status: "skip", mensagem: "Limite diário" });
          return false;
        }
        if (estadoInicial === "success") {
          addLog(`${prefix}✔ Já coletado recentemente`, "ok");
          sucessos++;
          coletaOk = true;
          break;
        }

        // 3. Preencher e-mail
        const emailOk = await injetar(tabId, (mail) => {
          const campo = document.querySelector("#address, input[type='email'], input[name='address']");
          if (!campo) return false;
          campo.focus();
          campo.value = mail;
          campo.dispatchEvent(new Event("input",  { bubbles: true }));
          campo.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }, [email]);

        if (!emailOk) {
          addLog(`${prefix}✖ Campo de e-mail não encontrado`, "error");
          tentativa++;
          await sleep(2000);
          continue;
        }
        addLog(`${prefix}E-mail inserido`, "ok");
        await sleep(800);

        // 4. Clicar no botão captcha
        const btnOk = await injetar(tabId, () => {
          const selectors = [
            "button.btn[data-target='#captchaModal']",
            "button[data-bs-target='#captchaModal']",
            "button[data-toggle='modal'][data-target*='captcha']",
            "button.btn-primary",
          ];
          for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) { btn.click(); return sel; }
          }
          return null;
        });

        if (!btnOk) {
          addLog(`${prefix}✖ Botão captcha não encontrado`, "error");
          tentativa++;
          continue;
        }
        addLog(`${prefix}Botão clicado (${btnOk})`, "ok");
        await sleep(2000); // modal abre

        // 5. POLLING ATIVO — background verifica a página a cada 10s
        const resultado = await aguardarCaptcha(tabId, prefix);

        if (resultado === "parado")     { updateFaucet(idx, { status: "skip", mensagem: "Interrompido" }); return false; }
        if (resultado === "daily_limit") { updateFaucet(idx, { status: "skip", mensagem: "Limite diário" }); return false; }

        if (resultado === "timeout") {
          addLog(`${prefix}✖ 120s sem resolução — recarregando...`, "error");
          tentativa++;
          continue;
        }

        if (resultado === "success") {
          addLog(`${prefix}✔ Sucesso detectado direto!`, "ok");
          await sleep(55000);
          sucessos++;
          coletaOk = true;
          break;
        }

        // "resolved" — captcha ok, clicar em Verify
        addLog(`${prefix}✔ Captcha resolvido! Clicando Verify...`, "ok");
        await sleep(500);

        await injetar(tabId, () => {
          const btns = ["#login", "button[type='submit']", ".btn-success", "button.btn-primary"];
          for (const sel of btns) {
            const b = document.querySelector(sel);
            if (b) { b.click(); return; }
          }
        });

        addLog(`${prefix}Verify clicado — aguardando resposta (8s)...`, "info");
        await sleep(8000);

        // 6. Verificar resultado final
        const final = await verificarPagina(tabId, false);
        addLog(`${prefix}Resultado final: ${final}`, final === "success" ? "ok" : "info");

        if (final === "daily_limit") { updateFaucet(idx, { status: "skip", mensagem: "Limite diário" }); return false; }

        if (final === "success") {
          addLog(`${prefix}✔ Coleta confirmada! Aguardando 55s...`, "ok");
          await sleep(55000);
          sucessos++;
          coletaOk = true;
          break;
        }

        // Resultado inconclusivo — recheck após 15s
        addLog(`${prefix}Resultado inconclusivo — recheck em 15s...`, "warn");
        await sleep(15000);
        const recheck = await verificarPagina(tabId, false);
        if (recheck === "success") {
          addLog(`${prefix}✔ Confirmado no recheck!`, "ok");
          await sleep(55000);
          sucessos++;
          coletaOk = true;
          break;
        }

        addLog(`${prefix}✖ Falha confirmada (${recheck})`, "error");
        tentativa++;

      } catch (e) {
        addLog(`${prefix}✖ Erro: ${String(e).slice(0, 150)}`, "error");
        tentativa++;
        await sleep(2000);
      }
    } // while tentativa

    addLog(`  ${coletaOk ? "✔" : "✖"} Coleta ${coleta}/3 ${coletaOk ? "concluída" : "falhou"}`, coletaOk ? "ok" : "error");
  } // for coleta

  const st = sucessos > 0 ? "ok" : "error";
  updateFaucet(idx, { status: st, mensagem: `${sucessos}/3 coletas` });
  addLog(`  ${faucet.coin}: ${sucessos}/3 coletas`, sucessos === 3 ? "ok" : sucessos > 0 ? "warn" : "error");
  return sucessos === 3;
}

// ─── VALIDAÇÃO DE LICENÇA ────────────────────
const LICENSE_URL  = "https://thanks.notsync.io/";
const LICENSE_KEY  = "notsync_license";
const LICENSE_POLL = 2000;   // verificar a cada 2s
const LICENSE_MAX  = 120000; // desistir após 2 min

async function validateLicense() {
  addLog("🔑 Abrindo página de licença...", "warn");
  broadcastState();

  // 1. Abrir guia de licença (ativa para o usuário interagir)
  const licTab = await new Promise(resolve => {
    chrome.tabs.create({ url: LICENSE_URL, active: true }, resolve);
  });
  const licTabId = licTab.id;

  // 2. Aguardar página carregar completamente
  await new Promise(resolve => {
    function listener(tabId, info) {
      if (tabId === licTabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(resolve, 15000); // fallback 15s
  });

  addLog("🔑 Aguarde 5s e clique em 'Validar entrada' no site...", "warn");

  // 3. Injetar em retry: limpar localStorage antigo, setar flags e anexar listener no botão
  //    Isso garante que licenças de sessões anteriores (Edge/Chrome) não passem.
  let listenerInjected = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    await sleep(1500);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: licTabId },
        func: (licKey) => {
          // SEMPRE limpar qualquer licença antiga do localStorage desta origem
          localStorage.removeItem(licKey);

          // Resetar flags de sessão — garantia cross-browser (Edge, Chrome, Arc...)
          window.__licenseReady    = false;
          window.__licenseCode     = null;
          window.__licenseListenerAttached = true;

          const btn = document.getElementById("validarBtn");
          if (btn) {
            // Clonar o botão para remover listeners anteriores (segurança extra)
            const clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);

            clone.addEventListener("click", () => {
              // Só capturar o código gerado NESTA sessão (após o timer de 5s da página)
              const codigo = localStorage.getItem(licKey);
              if (codigo && codigo.startsWith("NOTSYNC-")) {
                window.__licenseReady = true;
                window.__licenseCode  = codigo;
                clone.textContent     = "✔ Validado!";
                clone.style.background = "#16a34a";
                clone.style.color      = "#fff";
                clone.disabled         = true;
              } else {
                // Código ainda não gerado (usuário clicou antes dos 5s)
                clone.textContent = "⏳ Aguarde o código ser gerado...";
                setTimeout(() => {
                  const c2 = localStorage.getItem(licKey);
                  if (c2 && c2.startsWith("NOTSYNC-")) {
                    window.__licenseReady = true;
                    window.__licenseCode  = c2;
                    clone.textContent     = "✔ Validado!";
                    clone.style.background = "#16a34a";
                    clone.style.color      = "#fff";
                    clone.disabled         = true;
                  }
                }, 3000);
              }
            }, { once: true });
          }
        },
        args: [LICENSE_KEY],
      });
      listenerInjected = true;
      addLog("🔑 Aguarde 5s e clique em 'Validar entrada' no site...", "warn");
      break;
    } catch (e) {
      if (attempt === 7) {
        addLog("✖ Falha ao injetar listener: " + String(e).slice(0, 100), "error");
      }
    }
  }

  if (!listenerInjected) {
    try { await chrome.tabs.remove(licTabId); } catch {}
    return false;
  }

  // 4. Polling a cada 1s — só aceita quando:
  //    a) window.__licenseReady === true  (botão foi clicado NESTA sessão)
  //    b) window.__licenseCode começa com "NOTSYNC-" (gerado pelo timer do site)
  //    Qualquer valor pré-existente no localStorage foi apagado no passo 3.
  const LICENSE_TIMEOUT = 300000; // 5 minutos
  const deadline = Date.now() + LICENSE_TIMEOUT;
  let license = null;
  let lastLog  = 0;

  while (Date.now() < deadline) {
    await sleep(1000);

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: licTabId },
        func: () => ({
          ready:   window.__licenseReady   === true,
          code:    window.__licenseCode    || null,
        }),
        args: [],
      });

      const data = result?.[0]?.result;
      if (!data) continue;

      // Validação rigorosa: flag setada pelo clique E código com prefixo correto
      if (data.ready === true && data.code && data.code.startsWith("NOTSYNC-")) {
        license = data.code.trim();
        break;
      }

      // Log a cada 15s para não poluir
      if (Date.now() - lastLog > 15000) {
        lastLog = Date.now();
        const rem = Math.ceil((deadline - Date.now()) / 1000);
        addLog(`🔑 Aguardando "Validar entrada"... (${rem}s restantes)`, "warn");
      }

    } catch (e) {
      addLog("⚠ Aba de licença foi fechada.", "warn");
      break;
    }
  }

  // 5. Fechar a aba de licença
  try { await chrome.tabs.remove(licTabId); } catch {}

  if (license) {
    await new Promise(r => chrome.storage.local.set({ validatedLicense: license }, r));
    addLog(`✔ Licença validada com sucesso: ${license}`, "ok");
    return true;
  } else {
    addLog("✖ Tempo esgotado. Clique em 'Validar entrada' no site para liberar o bot.", "error");
    return false;
  }
}

// ─── BOT PRINCIPAL ────────────────────────────
async function startBot(email) {
  // Marcar como "validando" antes de qualquer coisa
  botState.rodando = true; botState.parar = false;
  botState.tempoInicio = Date.now(); botState.faucetIdx = 0;
  lastCaptchaSolverStep = 0;
  botState.log = [];
  broadcastState();

  // ── Verificar se já tem licença válida em cache ──
  const cached = await new Promise(r => chrome.storage.local.get(["validatedLicense"], r));
  let licenseOk = !!(cached.validatedLicense && cached.validatedLicense.length > 0);

  if (!licenseOk) {
    // Validar agora — abre a guia, aguarda o código
    licenseOk = await validateLicense();
  } else {
    addLog(`✔ Licença em cache: ${cached.validatedLicense}`, "ok");
  }

  if (!licenseOk) {
    // Sem licença — abortar
    botState.rodando = false;
    botState.tempoInicio = null;
    broadcastState();
    chrome.notifications.create({
      type: "basic", iconUrl: "icons/icon48.png",
      title: "RealMoney Bot — Licença inválida",
      message: "Acesse " + LICENSE_URL + " para gerar sua licença.",
    });
    return;
  }

  // Usar lista customizada do storage se existir, senão usar padrão
  const stored = await new Promise(r => chrome.storage.local.get(["customFaucets"], r));
  const source = (stored.customFaucets && stored.customFaucets.length > 0)
    ? stored.customFaucets.filter(f => f.enabled !== false)
    : FAUCETS;
  botState.faucets = source.map(f => ({ ...f, status:"pending", coletas:0, mensagem:"" }));

  addLog("═".repeat(42), "ok");
  addLog(`BOT INICIADO — ${new Date().toLocaleString("pt-BR")}`, "ok");
  addLog(`E-mail: ${email} | Faucets: ${FAUCETS.length}`, "info");
  addLog("═".repeat(42), "ok");

  const res = { ok: [], falhou: [] };

  try {
    const activeFaucets = botState.faucets.map((f,i) => ({...f, _idx:i}));
  for (let idx = 0; idx < activeFaucets.length; idx++) {
      if (botState.parar) { addLog("Bot parado pelo usuário.", "warn"); break; }

      botState.faucetIdx = idx;
      const f = activeFaucets[idx];
      addLog(`\n[${String(idx+1).padStart(2,"0")}/${activeFaucets.length}] ${f.coin} — ${f.site}`, "info");

      if (idx > 0) {
        addLog(`Pausa de ${PAUSA_ENTRE/1000}s...`, "info");
        await sleep(PAUSA_ENTRE);
      }

      if (botState.parar) break;

      const ok = await processarFaucet(idx, f, email);
      (ok ? res.ok : res.falhou).push(`${f.coin}(${f.site === "claimfreecoins" ? "cfc" : "bee"})`);
    }
  } finally {
    botTabId = null;
    botState.rodando = false; botState.parar = false;

    addLog("═".repeat(42), "ok");
    addLog(`RELATÓRIO — ${new Date().toLocaleTimeString("pt-BR")}`, "ok");
    addLog(`✔ Sucesso: ${res.ok.length} → ${res.ok.join(", ") || "—"}`, "ok");
    addLog(`✖ Falhou:  ${res.falhou.length} → ${res.falhou.join(", ") || "—"}`, res.falhou.length ? "error" : "info");
    addLog("═".repeat(42), "ok");

    chrome.notifications.create({
      type: "basic", iconUrl: "icons/icon48.png",
      title: "RealMoney Bot — Concluído",
      message: `✔ ${res.ok.length} sucesso · ✖ ${res.falhou.length} falhas`,
    });
    broadcastState();
  }
}
