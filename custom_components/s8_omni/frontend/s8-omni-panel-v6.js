import "./s8-omni-panel-v5.js";

const UI_VERSION = "v0.4.2";
const S8OmniPanel = customElements.get("s8-omni-panel");

async function ensureRefreshEntity(panel) {
  if (panel.__s8RefreshResolved || panel.__s8RefreshLoading || !panel._hass || !panel._panel) return;
  const entryId = panel._panel?.config?.entry_id;
  if (!entryId) return;

  panel.__s8RefreshLoading = true;
  try {
    const entries = await panel._hass.callWS({ type: "config/entity_registry/list" });
    const item = entries.find(
      (entry) =>
        entry.config_entry_id === entryId &&
        entry.platform === "s8_omni" &&
        entry.unique_id?.endsWith("_refresh"),
    );
    panel.__s8RefreshEntityId = item?.entity_id || null;
    panel.__s8RefreshResolved = true;
  } catch (err) {
    console.warn("S8 OMNI panel: refresh entity lookup failed", err);
  } finally {
    panel.__s8RefreshLoading = false;
    panel._queueRender?.();
  }
}

function installHeaderRefresh(panel, root) {
  const header = root.querySelector(".s8-app-header");
  if (!header) return;

  if (!root.querySelector("style[data-s8-header-refresh]")) {
    const style = document.createElement("style");
    style.dataset.s8HeaderRefresh = "true";
    style.textContent = `
      .s8-app-header {
        display: grid !important;
        grid-template-columns: 44px minmax(0,1fr) 44px !important;
        column-gap: 10px !important;
      }
      .s8-app-title {
        align-items: center;
        text-align: center;
      }
      .s8-app-refresh {
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: var(--card-background-color);
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 10px rgba(0,0,0,.10));
        -webkit-tap-highlight-color: transparent;
      }
      .s8-app-refresh ha-icon { --mdc-icon-size: 24px; }
      .s8-app-refresh:active { transform: scale(.97); }
      .s8-app-refresh:disabled { opacity: .38; }
      .s8-app-refresh.loading ha-icon { animation: s8RefreshSpin .8s linear infinite; }
      @keyframes s8RefreshSpin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .s8-app-refresh.loading ha-icon { animation: none; }
      }
    `;
    root.append(style);
  }

  const subtitle = header.querySelector(".s8-app-title span");
  if (subtitle) subtitle.textContent = `Робот-пылесос · UI ${UI_VERSION}`;

  let refresh = header.querySelector(".s8-app-refresh");
  if (!refresh) {
    refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "s8-app-refresh";
    refresh.setAttribute("aria-label", "Обновить данные");
    refresh.title = "Обновить";
    refresh.innerHTML = '<ha-icon icon="mdi:refresh"></ha-icon>';
    header.append(refresh);

    refresh.addEventListener("click", async () => {
      const entityId = panel.__s8RefreshEntityId;
      if (!entityId || !panel._hass || refresh.disabled) return;
      refresh.disabled = true;
      refresh.classList.add("loading");
      try {
        await panel._hass.callService("button", "press", { entity_id: entityId });
      } catch (err) {
        console.warn("S8 OMNI panel: refresh failed", err);
      } finally {
        setTimeout(() => {
          refresh.disabled = false;
          refresh.classList.remove("loading");
        }, 700);
      }
    });
  }

  refresh.disabled = !panel.__s8RefreshEntityId;
}

function updateDisplayedVersion(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    for (const oldVersion of ["v0.4.0", "v0.4.1"]) {
      if (textNode.nodeValue?.includes(oldVersion)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(oldVersion, UI_VERSION);
      }
    }
  }
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8HeaderRefreshV042) {
  S8OmniPanel.prototype.__s8HeaderRefreshV042 = true;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;

    ensureRefreshEntity(this);
    installHeaderRefresh(this, root);
    updateDisplayedVersion(root);
  };
}
