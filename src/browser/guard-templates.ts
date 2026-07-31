const chips = document.querySelectorAll<HTMLButtonElement>(".template-chip");
const amountInput = document.querySelector<HTMLInputElement>("#guard-amount");
const limitInput = document.querySelector<HTMLInputElement>("#guard-limit");
const purposeInput = document.querySelector<HTMLInputElement>("#guard-purpose");

for (const chip of chips) {
  chip.addEventListener("click", () => {
    const amount = chip.dataset.amount ?? "";
    const purpose = chip.dataset.purpose ?? "";
    if (amountInput) amountInput.value = amount;
    if (limitInput) limitInput.value = amount;
    if (purposeInput) purposeInput.value = purpose;
    for (const entry of chips) entry.classList.remove("active");
    chip.classList.add("active");
  });
}
