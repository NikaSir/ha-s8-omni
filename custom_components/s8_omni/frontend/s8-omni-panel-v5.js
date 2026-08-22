import "./s8-omni-panel-v4.js";

const UI_VERSION = "v0.4.0";
const PARENT_ROUTE = "/dashboard-actions";
const S8OmniPanel = customElements.get("s8-omni-panel");

function navigateExplicit(path) {
  const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.history.pushState({ from }, "", path);
  window.dispatchEvent(
    new CustomEvent("location-changed", {
      bubbles: true,
      composed: true,
      detail: { replace: false },
    }),
  );
}

function replaceText(root, from, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    if (textNode.nodeValue?.includes(from)) {
      textNode.nodeValue = textNode.nodeValue.replaceAll(from, to);
    }
  }
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8NikasShellV040) {
  S8OmniPanel.prototype.__s8NikasShellV040 = true;

  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);

    const root = this.shadowRoot;
    const main = root?.querySelector("main");
    if (!root || !main) return;

    // Dashboard v0.2.1/v0.3.0 used a sidebar-menu affordance. The unified
    // NikaS shell replaces it with deterministic application Back navigation.
    root.querySelector(".s8-ha-topbar")?.remove();

    if (!root.querySelector("style[data-s8-nikas-shell]")) {
      const style = document.createElement("style");
      style.dataset.s8NikasShell = "true";
      style.textContent = `
        main {
          min-height: 100vh;
          padding-bottom: calc(78px + env(safe-area-inset-bottom)) !important;
        }
        .s8-app-header {
          position: sticky;
          top: 0;
          z-index: 45;
          width: min(100%, 560px);
          margin: 0 auto;
          min-height: 64px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: max(9px, env(safe-area-inset-top)) 12px 9px;
          background: color-mix(in srgb, var(--primary-background-color) 93%, transparent);
          border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 68%, transparent);
          backdrop-filter: blur(18px) saturate(145%);
          -webkit-backdrop-filter: blur(18px) saturate(145%);
        }
        .s8-app-back {
          width: 44px;
          min-width: 44px;
          height: 44px;
          border: 0;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          box-shadow: var(--ha-card-box-shadow, 0 2px 10px rgba(0,0,0,.10));
          -webkit-tap-highlight-color: transparent;
        }
        .s8-app-back:active { transform: scale(.97); }
        .s8-app-back ha-icon { --mdc-icon-size: 25px; }
        .s8-app-title { min-width: 0; display:flex; flex-direction:column; gap:2px; }
        .s8-app-title strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 20px;
          line-height: 1.1;
          letter-spacing: -.02em;
        }
        .s8-app-title span {
          color: var(--secondary-text-color);
          font-size: 11px;
          font-weight: 650;
        }
        main > nav {
          position: fixed !important;
          left: 50%;
          right: auto;
          bottom: 0 !important;
          top: auto !important;
          z-index: 50;
          width: min(100%, 560px) !important;
          transform: translateX(-50%);
          padding: 7px max(7px, env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(7px, env(safe-area-inset-left)) !important;
          border: 1px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
          border-bottom: 0;
          border-radius: 18px 18px 0 0;
          box-shadow: 0 -6px 24px rgba(0,0,0,.08);
          background: color-mix(in srgb, var(--card-background-color) 94%, transparent) !important;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        main > nav button { min-height: 56px !important; }
        @media (min-width: 760px) {
          .s8-app-header, main > nav { width: min(560px, calc(100% - 32px)) !important; }
          .s8-app-header {
            border-left:1px solid color-mix(in srgb, var(--divider-color) 45%, transparent);
            border-right:1px solid color-mix(in srgb, var(--divider-color) 45%, transparent);
          }
        }
      `;
      root.append(style);
    }

    if (!main.querySelector(".s8-app-header")) {
      const header = document.createElement("header");
      header.className = "s8-app-header";
      header.innerHTML = `
        <button class="s8-app-back" type="button" aria-label="Назад" title="Назад">
          <ha-icon icon="mdi:arrow-left"></ha-icon>
        </button>
        <div class="s8-app-title">
          <strong>S8 OMNI</strong>
          <span>Робот-пылесос · UI ${UI_VERSION}</span>
        </div>
      `;
      header.querySelector(".s8-app-back")?.addEventListener("click", () => navigateExplicit(PARENT_ROUTE));
      main.prepend(header);
    }

    // The Header owns the application name. The hero owns appliance state.
    replaceText(root, "S8 OMNI · v0.3.0", "СОСТОЯНИЕ");
    replaceText(root, "S8 OMNI · v0.4.0", "СОСТОЯНИЕ");
    replaceText(root, "v0.3.0", UI_VERSION);

    const nav = main.querySelector(":scope > nav");
    if (nav) {
      nav.setAttribute("aria-label", "Разделы S8 OMNI");
      nav.querySelectorAll("button[data-view]").forEach((button) => {
        if (button.classList.contains("active")) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
    }
  };
}
