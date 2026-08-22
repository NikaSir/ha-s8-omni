import "./s8-omni-panel-v2.js";

// Dashboard v0.2.1 shell enhancement.
// Keep the appliance UI itself in v2 and add only a Home Assistant navigation
// affordance here so panel UI logic remains independent from HA's sidebar.
const S8OmniPanel = customElements.get("s8-omni-panel");

if (S8OmniPanel && !S8OmniPanel.prototype.__s8MenuReturnPatched) {
  S8OmniPanel.prototype.__s8MenuReturnPatched = true;

  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);

    const root = this.shadowRoot;
    const main = root?.querySelector("main");
    if (!root || !main || main.querySelector(".s8-ha-topbar")) return;

    const style = document.createElement("style");
    style.dataset.s8MenuReturn = "true";
    style.textContent = `
      .s8-ha-topbar {
        position: sticky;
        top: 0;
        z-index: 40;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: max(10px, env(safe-area-inset-top)) 16px 10px;
        background: color-mix(in srgb, var(--primary-background-color) 91%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 65%, transparent);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
      }
      .s8-ha-menu {
        min-height: 46px;
        border: 0;
        border-radius: 16px;
        padding: 0 15px 0 12px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        box-shadow: var(--ha-card-box-shadow, 0 3px 14px rgba(0,0,0,.09));
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .s8-ha-menu:active { transform: scale(.97); }
      .s8-ha-menu ha-icon { --mdc-icon-size: 24px; color: var(--primary-color); }
      .s8-ha-appname {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--secondary-text-color);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      @media (min-width: 760px) {
        .s8-ha-topbar {
          width: min(100%, 920px);
          margin: 0 auto;
          border-left: 1px solid color-mix(in srgb, var(--divider-color) 45%, transparent);
          border-right: 1px solid color-mix(in srgb, var(--divider-color) 45%, transparent);
          border-radius: 0 0 18px 18px;
        }
      }
    `;
    root.append(style);

    const topbar = document.createElement("div");
    topbar.className = "s8-ha-topbar";
    topbar.innerHTML = `
      <button class="s8-ha-menu" type="button" aria-label="Открыть меню Home Assistant">
        <ha-icon icon="mdi:menu"></ha-icon>
        <span>Меню</span>
      </button>
      <div class="s8-ha-appname">S8 OMNI</div>
    `;

    topbar.querySelector(".s8-ha-menu")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-toggle-menu", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    main.prepend(topbar);
  };
}
