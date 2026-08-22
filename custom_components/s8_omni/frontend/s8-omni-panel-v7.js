import "./s8-omni-panel-v6.js";

const UI_VERSION = "v0.4.3";
const S8OmniPanel = customElements.get("s8-omni-panel");

function installFullWidthTabBar(root) {
  if (root.querySelector("style[data-s8-full-width-tabbar]")) return;

  const style = document.createElement("style");
  style.dataset.s8FullWidthTabbar = "true";
  style.textContent = `
    main {
      padding-bottom: calc(88px + env(safe-area-inset-bottom)) !important;
    }

    main > nav {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      top: auto !important;
      z-index: 50 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      transform: none !important;
      box-sizing: border-box !important;
      padding:
        7px
        max(7px, env(safe-area-inset-right))
        calc(7px + env(safe-area-inset-bottom))
        max(7px, env(safe-area-inset-left)) !important;
      border: 0 !important;
      border-top: 1px solid color-mix(in srgb, var(--divider-color) 72%, transparent) !important;
      border-radius: 0 !important;
      box-shadow: 0 -4px 18px rgba(0,0,0,.07) !important;
      background: color-mix(in srgb, var(--card-background-color) 96%, transparent) !important;
      backdrop-filter: blur(18px) saturate(135%);
      -webkit-backdrop-filter: blur(18px) saturate(135%);
    }

    main > nav button {
      min-height: 56px !important;
      margin: 0 !important;
      box-shadow: none !important;
    }

    main > nav button.active,
    main > nav button[aria-current="page"] {
      box-shadow: none !important;
      transform: none !important;
    }

    @media (min-width: 760px) {
      main > nav {
        width: 100% !important;
        max-width: none !important;
      }
    }
  `;
  root.append(style);
}

function updateDisplayedVersion(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    for (const oldVersion of ["v0.4.0", "v0.4.1", "v0.4.2"]) {
      if (textNode.nodeValue?.includes(oldVersion)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(oldVersion, UI_VERSION);
      }
    }
  }
}

if (S8OmniPanel && !S8OmniPanel.prototype.__s8FullWidthTabBarV043) {
  S8OmniPanel.prototype.__s8FullWidthTabBarV043 = true;
  const originalRender = S8OmniPanel.prototype._render;

  S8OmniPanel.prototype._render = function (...args) {
    originalRender.apply(this, args);
    const root = this.shadowRoot;
    if (!root) return;

    installFullWidthTabBar(root);
    updateDisplayedVersion(root);
  };
}
