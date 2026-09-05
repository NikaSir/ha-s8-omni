import "./s8-omni-panel.js";

const Panel = customElements.get("s8-omni-panel");
if (Panel && !Panel.prototype.__s8ButtonUnknownCompatibilityPatch) {
  Panel.prototype.__s8ButtonUnknownCompatibilityPatch = true;
  Panel.prototype._call = async function patchedCall(domain, service, key, extra = {}) {
    const entityId = this._entityId(key);
    const state = entityId ? this._hass?.states?.[entityId] : null;
    const targetState = String(state?.state || "").toLowerCase();
    // Home Assistant button entities legitimately start as `unknown` until the
    // first press. Treat that as callable; only `unavailable` means the button
    // cannot be used. Other domains retain the stricter existing rule.
    const targetAvailable = state && (
      domain === "button"
        ? targetState !== "unavailable"
        : !["unknown", "unavailable"].includes(targetState)
    );
    if (!entityId || !this._hass || !targetAvailable) {
      this._commandError = "Цель команды недоступна или не подтверждена Home Assistant.";
      this._queueLivePatch();
      return false;
    }
    const commandKey = `${domain}.${service}:${entityId}`;
    if (this._busyCommands.has(commandKey) || this._busyCommands.size > 0) return false;
    this._busyCommands.add(commandKey);
    this._commandError = null;
    this._queueLivePatch();
    try {
      await this._hass.callService(domain, service, { entity_id: entityId, ...extra });
      return true;
    } catch (error) {
      this._commandError = error instanceof Error ? error.message : String(error || "Команда не выполнена.");
      return false;
    } finally {
      this._busyCommands.delete(commandKey);
      this._queueLivePatch();
    }
  };
}
