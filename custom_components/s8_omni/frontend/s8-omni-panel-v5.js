import "./s8-omni-panel-v4.js";

const UI_VERSION = "v0.4.0";
const PARENT_ROUTE = "/dashboard-actions";

function explicitNavigate(path) {
  if (window.location.pathname === path) return;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("location-changed"));
}

function installAppShellStyles(root) {
  if (root.querySelector("style[data-s8-nikas-shell]")) return;
  const style = document.createElement("style");
  style.dataset.s8NikasShell = "true";
  style.textContent = `
    .s8-ha-topbar {
      display: grid !important;
      grid-template-columns: minmax(92px,1fr) auto minmax(92px,1fr) !important;
      align-items: center !important;
      min-height: 62px;
      padding: max(8px, env(safe-area-inset-top)) 14px 8px !important;
    }
    .s8-ha-back {
      justify-self: start;
      min-width: 0;
      min-height: 46px;
      border: 0;
      border-radius: 16px;
      padding: 0 12px 0 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-shadow: var(--ha-card-box-shadow, 0 3px 14px rgba(0,0,0,.09));
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .s8-ha-back ha-icon { --mdc-icon-size: 24px; color: var(--primary-color); }
    .s8-ha-back:active { transform: scale(.97); }
    .s8-ha-title {
      justify-self: center;
      min-width: 0;
      max-width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 17px;
      font-weight: 850;
      letter-spacing: -.01em;
    }
    .s8-ha-header-spacer { justify-self:end; width:46px; height:46px; }
    @media (max-width: 380px) {
      .s8-ha-topbar { grid-template-columns: 52px 1fr 52px !important; }
      .s8-ha-back { width:46px; padding:0; justify-content:center; }
      .s8-ha-back span { display:none; }
      .s8-ha-title { max-width:100%; }
    }
  `;
  root.append(style);
}

function replaceHeader(root) {
  const topbar = root.querySelector(".s8-ha-topbar");
  if (!topbar) return;

  topbar.innerHTML = `
    <button class="s8-ha-back" type="button" aria-label="Назад в Действия">
      <ha-icon icon="mdi:arrow-left"></ha-icon>
      <span>Назад</span>
    </button>
    <div class="s8-ha-title">S8 OMNI</div>
    <div class="s8-ha-header-spacer" aria-hidden="true"></div>
  `;
  topbar.querySelector(".s8-ha-back")?.addEventListener("click", () => explicitNavigate(PARENT_ROUTE));
}

function removeHeroDuplication(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    const value = textNode.nodeValue || "";
    if (/S8 OMNI\s*·\s*v0\.[0-9.]+/i.test(value)) {
      textNode.nodeValue = value.replace(/S8 OMNI\s*·\s*v0\.[0-9.]+/gi, "СОСТОЯНИЕ");
    }
    if (value.includes("v0.3.0")) textNode.nodeValue = textNode.nodeValue.replaceAll("v0.3.0", UI_VERSION);
  }
}

const S8OmniPanel = customElements.get("s8-omni-panel");

if (S8OmniPanel && !S8OmniPanel.prototype.__s8NikasShellPatched) {
  S8OmniPanel.prototype.__s8NikasShellPatched = true;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;
    installAppShellStyles(root);
    replaceHeader(root);
    removeHeroDuplication(root);
  };
}
