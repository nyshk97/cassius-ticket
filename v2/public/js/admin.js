// 管理画面用 JS。旧 Stimulus controllers (clipboard / dropdown / nested_form) の移植 + 削除確認

// 削除確認 (旧 turbo_confirm)
document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-confirm]");
  if (form && !confirm(form.dataset.confirm)) {
    e.preventDefault();
  }
});

document.addEventListener("click", (e) => {
  // dropdown: メニュー外クリックで閉じる
  document.querySelectorAll("details[data-dropdown][open]").forEach((d) => {
    if (!d.contains(e.target)) d.removeAttribute("open");
  });

  // nested form: 行追加
  const addBtn = e.target.closest("[data-nested-add]");
  if (addBtn) {
    e.preventDefault();
    const root = addBtn.closest("[data-nested-form]");
    const html = root
      .querySelector("[data-nested-template]")
      .innerHTML.replace(/NEW_RECORD/g, `new_${Date.now()}`);
    root.querySelector("[data-nested-container]").insertAdjacentHTML("beforeend", html);
    return;
  }

  // nested form: 行削除（保存済みは _destroy=1 で非表示、新規行は DOM から除去）
  const removeBtn = e.target.closest("[data-nested-remove]");
  if (removeBtn) {
    e.preventDefault();
    const field = removeBtn.closest("[data-nested-field]");
    const isPersisted = field.querySelector("input[name$='[id]']");
    if (isPersisted) {
      field.querySelector("[data-destroy-flag]").value = "1";
      field.style.display = "none";
    } else {
      field.remove();
    }
    return;
  }

  // clipboard: 注文URLコピー
  const copyBtn = e.target.closest("[data-clipboard-copy]");
  if (copyBtn) {
    const root = copyBtn.closest("[data-clipboard]");
    const source = root.querySelector("[data-clipboard-source]");
    const writeText = navigator.clipboard
      ? navigator.clipboard.writeText(source.value)
      : Promise.reject();
    writeText
      .catch(() => {
        source.select();
        document.execCommand("copy");
      })
      .then(() => showCopySuccess(root));
  }
});

const COPY_ICON =
  '<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />';
const CHECK_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />';

function showCopySuccess(root) {
  const label = root.querySelector("[data-clipboard-label]");
  const icon = root.querySelector("[data-clipboard-icon]");
  const original = label.textContent;
  label.textContent = "コピー済";
  icon.innerHTML = CHECK_ICON;
  setTimeout(() => {
    label.textContent = original;
    icon.innerHTML = COPY_ICON;
  }, 2000);
}
