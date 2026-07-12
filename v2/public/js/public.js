// 注文フォーム用 JS。旧 ticket_counter Stimulus controller の移植

document.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-counter-increment]");
  const dec = e.target.closest("[data-counter-decrement]");
  if (!inc && !dec) return;

  const row = (inc || dec).closest("[data-ticket-counter]");
  const input = row.querySelector("[data-counter-input]");
  const display = row.querySelector("[data-counter-display]");
  const value = parseInt(input.value, 10) || 0;

  if (inc) {
    input.value = value + 1;
  } else if (value > 0) {
    input.value = value - 1;
  }
  display.textContent = input.value;
});

document.addEventListener("change", (e) => {
  const input = e.target.closest("[data-counter-input]");
  if (!input) return;
  const row = input.closest("[data-ticket-counter]");
  row.querySelector("[data-counter-display]").textContent = input.value || 0;
});
