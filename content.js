// ─────────────────────────────────────────────
// CONTENT SCRIPT — CFC Bot
// Verificação de captcha a cada 10s por 120s
// ─────────────────────────────────────────────

(function () {
  "use strict";

  const DAILY_LIMIT_TEXT  = "Your daily claim limit has been reached";
  const CHECK_INTERVAL_MS = 10000;   // verifica a cada 10 segundos
  const MAX_WAIT_MS       = 120000;  // máximo 120 segundos

  if (window.__cfcBotInjected) return;
  window.__cfcBotInjected = true;

  // ─── Estado da verificação ─────────────────
  let checkCount     = 0;
  const maxChecks    = MAX_WAIT_MS / CHECK_INTERVAL_MS; // 12 verificações
  let captchaWasOpen = false;
  let pollInterval   = null;
  let notified       = false;

  // ─── Utilitários DOM ──────────────────────
  function getAlertDanger() {
    return [...document.querySelectorAll(".alert-danger, div.alert.alert-danger")];
  }

  function getAlertSuccess() {
    return [...document.querySelectorAll(".alert-success, div.alert.alert-success")];
  }

  function getCaptchaIframe() {
    return document.querySelector(
      "iframe[title*='recaptcha challenge'], " +
      "iframe[src*='recaptcha'][src*='bframe']"
    );
  }

  // ─── Enviar notificação única ──────────────
  function notify(type, extra) {
    if (notified) return;
    notified = true;
    stopPolling();
    chrome.runtime.sendMessage({ type, ...extra }).catch(() => {});
  }

  // ─── Parar polling ─────────────────────────
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  // ─── Verificação principal (a cada 10s) ────
  function runCheck() {
    checkCount++;
    const elapsed = checkCount * (CHECK_INTERVAL_MS / 1000);

    // 1. Limite diário
    for (const a of getAlertDanger()) {
      if (a.textContent.includes(DAILY_LIMIT_TEXT)) {
        console.log("[CFCBot] Limite diario detectado em check #" + checkCount);
        notify("DAILY_LIMIT");
        return;
      }
    }

    // 2. Sucesso
    for (const a of getAlertSuccess()) {
      if (a.textContent.trim().length > 5) {
        console.log("[CFCBot] Sucesso detectado em check #" + checkCount);
        notify("CLAIM_SUCCESS");
        return;
      }
    }

    // 3. iframe do challenge reCAPTCHA
    const challengeIframe = getCaptchaIframe();
    if (challengeIframe && challengeIframe.offsetParent !== null) {
      captchaWasOpen = true;
      console.log("[CFCBot] Challenge iframe aberto (" + elapsed + "s)");
    } else if (captchaWasOpen) {
      captchaWasOpen = false;
      console.log("[CFCBot] Challenge iframe fechou — captcha resolvido! (" + elapsed + "s)");
      notify("CAPTCHA_RESOLVED");
      return;
    }

    // 4. Token preenchido
    const responseField = document.querySelector(
      "textarea[name='g-recaptcha-response'], input[name='g-recaptcha-response']"
    );
    if (responseField && responseField.value && responseField.value.length > 20) {
      console.log("[CFCBot] Token g-recaptcha-response preenchido (" + elapsed + "s)");
      notify("CAPTCHA_RESOLVED");
      return;
    }

    // 5. Timeout
    if (checkCount >= maxChecks) {
      console.log("[CFCBot] Timeout " + (MAX_WAIT_MS / 1000) + "s sem resolucao. Sinalizando CAPTCHA_TIMEOUT.");
      notify("CAPTCHA_TIMEOUT");
      return;
    }

    console.log("[CFCBot] Check #" + checkCount + "/" + maxChecks + " sem resolucao (" + elapsed + "s)");
  }

  // ─── Iniciar polling ───────────────────────
  function startCaptchaPolling() {
    if (pollInterval) return;
    notified       = false;
    checkCount     = 0;
    captchaWasOpen = false;
    console.log("[CFCBot] Polling iniciado: 10s x 12 verificacoes (max 120s)");
    pollInterval = setInterval(runCheck, CHECK_INTERVAL_MS);
  }

  // ─── Verificação imediata ao carregar ──────
  function checkOnLoad() {
    for (const a of getAlertDanger()) {
      if (a.textContent.includes(DAILY_LIMIT_TEXT)) { notify("DAILY_LIMIT"); return; }
    }
    for (const a of getAlertSuccess()) {
      if (a.textContent.trim().length > 5) { notify("CLAIM_SUCCESS"); return; }
    }
  }

  // ─── Observar clique no botão captcha ──────
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(
      "button.btn[data-target='#captchaModal'], button[data-bs-target='#captchaModal'], button[data-toggle='modal']"
    );
    if (btn) {
      console.log("[CFCBot] Botao captcha clicado — iniciando polling em 3s");
      setTimeout(startCaptchaPolling, 3000);
    }
  }, true);

  // ─── Ouvir comandos do background ─────────
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "FILL_EMAIL") {
      const campo = document.querySelector("#address");
      if (campo) {
        campo.focus();
        campo.value = msg.email;
        campo.dispatchEvent(new Event("input",  { bubbles: true }));
        campo.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    if (msg.type === "START_CAPTCHA_POLL") {
      startCaptchaPolling();
    }
    if (msg.type === "RESET_POLL") {
      stopPolling();
      notified   = false;
      checkCount = 0;
    }
  });

  // ─── MutationObserver para alertas dinâmicos ─
  const observer = new MutationObserver(function () {
    if (notified) return;
    for (const a of getAlertDanger()) {
      if (a.textContent.includes(DAILY_LIMIT_TEXT)) { notify("DAILY_LIMIT"); return; }
    }
    for (const a of getAlertSuccess()) {
      if (a.textContent.trim().length > 5) { notify("CLAIM_SUCCESS"); return; }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  // Limpeza após 5 minutos
  setTimeout(function () {
    stopPolling();
    observer.disconnect();
  }, 300000);

  checkOnLoad();
  console.log("[CFCBot] Content script inicializado.");

})();
