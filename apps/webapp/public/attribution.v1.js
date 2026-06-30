(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define(f):(g=typeof globalThis!=='undefined'?globalThis:g||self,g.RefRefAttribution=f());})(this,(function(){'use strict';class CookieManager {
  options;
  constructor(options = {}) {
    this.options = {
      Path: "/",
      "Max-Age": 90 * 24 * 60 * 60,
      // 90 days in seconds
      SameSite: "Lax",
      // Auto-detect Secure based on protocol (HTTPS = Secure: true)
      ...window.location.protocol === "https:" ? { Secure: true } : {},
      ...options
      // User options override defaults
    };
  }
  set(name, value) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    for (const [key, val] of Object.entries(this.options)) {
      if (val === void 0 || val === null) continue;
      if (typeof val === "boolean") {
        if (val) {
          parts.push(key);
        }
      } else {
        parts.push(`${key}=${val}`);
      }
    }
    document.cookie = parts.join("; ");
  }
  get(name) {
    const value = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
  }
  delete(name) {
    const deleteOptions = { ...this.options, "Max-Age": -1 };
    const parts = [`${name}=`];
    for (const [key, val] of Object.entries(deleteOptions)) {
      if (val === void 0 || val === null) continue;
      if (typeof val === "boolean") {
        if (val) {
          parts.push(key);
        }
      } else {
        parts.push(`${key}=${val}`);
      }
    }
    document.cookie = parts.join("; ");
  }
}const DEFAULT_AUTO_ATTACH = "data-refref";
const FORM = {
  SELECTOR: "form[data-refref]",
  SELECTOR_ALL: "form",
  FIELD: "refcode"
};
const URL = {
  CODE_PARAM: "refcode"
};
const COOKIE = {
  CODE_KEY: "refref-refcode"};class FormManager {
  fieldName = FORM.FIELD;
  // Hard-coded to "refcode"
  constructor() {
  }
  attachToAll(mode, code) {
    if (mode === "false") {
      return;
    }
    const selector = mode === "all" ? FORM.SELECTOR_ALL : FORM.SELECTOR;
    const forms = document.querySelectorAll(selector);
    forms.forEach((form) => this.attachTo(form, code));
  }
  attachTo(form, code) {
    if (!form || !(form instanceof HTMLFormElement)) {
      console.warn("Invalid form element provided to attachTo");
      return;
    }
    this.ensureHiddenField(form);
    if (code) {
      this.updateHiddenField(form, code);
    }
  }
  ensureHiddenField(form) {
    if (!form.querySelector(`input[name="${this.fieldName}"]`)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = this.fieldName;
      form.appendChild(input);
    }
  }
  updateHiddenField(form, value) {
    const field = form.querySelector(
      `input[name="${this.fieldName}"]`
    );
    if (field) {
      field.value = value;
    }
  }
}class DOMObserver {
  constructor(formManager, mode, code) {
    this.formManager = formManager;
    this.mode = mode;
    this.code = code;
  }
  observer = null;
  isObserving = false;
  start() {
    if (this.mode === "false" || this.isObserving) {
      return;
    }
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    this.isObserving = true;
  }
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.isObserving = false;
    }
  }
  handleMutations(mutations) {
    const selector = this.mode === "all" ? FORM.SELECTOR_ALL : FORM.SELECTOR;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLFormElement) {
            if (this.shouldAttachToForm(node, selector)) {
              this.formManager.attachTo(node, this.code);
            }
          }
          if (node instanceof HTMLElement) {
            const forms = node.querySelectorAll(selector);
            forms.forEach((form) => {
              this.formManager.attachTo(form, this.code);
            });
          }
        });
      }
    }
  }
  shouldAttachToForm(form, selector) {
    if (this.mode === "all") {
      return true;
    }
    return form.matches(selector);
  }
  updateCode(code) {
    this.code = code;
  }
}let cookieManager;
let formManager;
let domObserver = null;
let isInitialized = false;
let refrefUniqueCode;
let autoAttachMode = DEFAULT_AUTO_ATTACH;
function getAutoAttachFromScriptTag() {
  if (typeof document === "undefined") return void 0;
  const scripts = document.querySelectorAll("script[data-auto-attach]");
  const lastScript = scripts[scripts.length - 1];
  if (lastScript) {
    const mode = lastScript.getAttribute("data-auto-attach");
    if (mode === "false" || mode === "data-refref" || mode === "all") {
      return mode;
    }
  }
  return void 0;
}
function getCookieOptionsFromScriptTag() {
  if (typeof document === "undefined") return void 0;
  const scripts = document.querySelectorAll("script[data-cookie-options]");
  const lastScript = scripts[scripts.length - 1];
  if (lastScript) {
    const jsonString = lastScript.getAttribute("data-cookie-options");
    if (jsonString) {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn(
          "Failed to parse data-cookie-options JSON, using defaults:",
          error
        );
      }
    }
  }
  return void 0;
}
function init() {
  if (isInitialized) return;
  const scriptTagMode = getAutoAttachFromScriptTag();
  autoAttachMode = scriptTagMode ?? DEFAULT_AUTO_ATTACH;
  const scriptTagCookieOptions = getCookieOptionsFromScriptTag();
  cookieManager = new CookieManager(scriptTagCookieOptions);
  formManager = new FormManager();
  const existingCodeInCookie = cookieManager.get(COOKIE.CODE_KEY);
  if (existingCodeInCookie) {
    refrefUniqueCode = existingCodeInCookie;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get(URL.CODE_PARAM);
  if (codeFromUrl) {
    refrefUniqueCode = codeFromUrl;
  }
  if (refrefUniqueCode) {
    cookieManager.set(COOKIE.CODE_KEY, refrefUniqueCode);
  }
  if (refrefUniqueCode) {
    formManager.attachToAll(autoAttachMode, refrefUniqueCode);
    if (autoAttachMode !== "false") {
      domObserver = new DOMObserver(
        formManager,
        autoAttachMode,
        refrefUniqueCode
      );
      domObserver.start();
    }
  }
  isInitialized = true;
}
const RefRefAttribution = {
  attachToAll() {
    if (!isInitialized) init();
    formManager.attachToAll(autoAttachMode, refrefUniqueCode);
  },
  attachTo(form) {
    if (!isInitialized) init();
    formManager.attachTo(form, refrefUniqueCode);
  },
  getCode() {
    if (!isInitialized) init();
    return refrefUniqueCode;
  },
  stopObserver() {
    if (domObserver) {
      domObserver.stop();
    }
  }
};
if (typeof window !== "undefined") {
  window.RefRefAttribution = RefRefAttribution;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
} else {
  console.error("RefRefAttribution is not supported in this environment");
}return RefRefAttribution;}));//# sourceMappingURL=attribution-script.umd.js.map
