const form = document.querySelector<HTMLFormElement>("#pay-form");
const input = document.querySelector<HTMLInputElement>("#pay-url");
const result = document.querySelector<HTMLElement>("#pay-result");
const recentWrap = document.querySelector<HTMLElement>("#pay-recent-wrap");
const recentButton = document.querySelector<HTMLButtonElement>("#pay-recent");
const LAST_LINK_KEY = "ledgerguard.lastPaymentLink";

function isValidPaymentLink(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.pathname === "/guard" || url.pathname.endsWith("/guard");
  } catch {
    return false;
  }
}

function show(kind: string, title: string, message: string): void {
  if (!result) return;
  result.hidden = false;
  result.className = `result ${kind}`;
  result.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  result.append(heading, paragraph);
}

function rememberLink(value: string): void {
  try {
    sessionStorage.setItem(LAST_LINK_KEY, value);
  } catch {
    // Ignore private mode storage failures.
  }
}

function renderRecentLink(): void {
  if (!recentWrap || !recentButton) return;
  let saved = "";
  try {
    saved = sessionStorage.getItem(LAST_LINK_KEY) ?? "";
  } catch {
    saved = "";
  }
  if (saved && isValidPaymentLink(saved)) {
    recentWrap.hidden = false;
    recentButton.onclick = () => {
      if (input) input.value = saved;
      location.href = saved;
    };
  } else {
    recentWrap.hidden = true;
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = input?.value.trim() ?? "";
  if (!value) {
    show("review", "Paste a link", "Paste the full payment link you received.");
    return;
  }
  if (!isValidPaymentLink(value)) {
    show(
      "review",
      "Invalid payment link",
      "The URL should look like https://ledgerguard-gules.vercel.app/guard?recipient=0x…",
    );
    return;
  }
  rememberLink(value);
  location.href = value;
});

const params = new URLSearchParams(location.search);
const prefill = params.get("url")?.trim();
if (prefill && input) {
  input.value = prefill;
}

renderRecentLink();
