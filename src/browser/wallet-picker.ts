import type { ProviderDetail } from "./wallet-core.js";

function walletInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "W";
}

export function showWalletPicker(
  providers: ProviderDetail[],
): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "wallet-picker-overlay";
    overlay.setAttribute("role", "presentation");

    const dialog = document.createElement("section");
    dialog.className = "wallet-picker-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "wallet-picker-title");

    const title = document.createElement("h2");
    title.id = "wallet-picker-title";
    title.textContent = "Choose a wallet";

    const lead = document.createElement("p");
    lead.className = "wallet-picker-lead";
    lead.textContent =
      "Select the wallet you want to use. LedgerGuard never sees your private key.";

    const list = document.createElement("div");
    list.className = "wallet-picker-list";

    const cleanup = (value: string | null) => {
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      resolve(value);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cleanup(null);
    };

    for (const entry of providers) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wallet-picker-option";

      const iconWrap = document.createElement("span");
      iconWrap.className = "wallet-picker-icon";
      if (entry.info.icon) {
        const icon = document.createElement("img");
        icon.src = entry.info.icon;
        icon.alt = "";
        icon.width = 28;
        icon.height = 28;
        iconWrap.append(icon);
      } else {
        iconWrap.textContent = walletInitial(entry.info.name);
      }

      const label = document.createElement("span");
      label.className = "wallet-picker-name";
      label.textContent = entry.info.name;

      button.append(iconWrap, label);
      button.addEventListener("click", () => cleanup(entry.info.uuid));
      list.append(button);
    }

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "wallet-picker-cancel secondary";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => cleanup(null));

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) cleanup(null);
    });

    dialog.append(title, lead, list, cancel);
    overlay.append(dialog);
    document.body.append(overlay);
    document.addEventListener("keydown", onKeyDown);

    const firstOption = list.querySelector<HTMLButtonElement>("button");
    firstOption?.focus();
  });
}
