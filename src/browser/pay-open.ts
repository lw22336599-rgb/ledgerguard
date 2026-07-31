const form = document.querySelector<HTMLFormElement>("#pay-form");
const input = document.querySelector<HTMLInputElement>("#pay-url");
const result = document.querySelector<HTMLElement>("#pay-result");

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
  location.href = value;
});

const params = new URLSearchParams(location.search);
const prefill = params.get("url")?.trim();
if (prefill && input) {
  input.value = prefill;
}
