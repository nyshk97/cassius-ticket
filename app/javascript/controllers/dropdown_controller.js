import { Controller } from "@hotwired/stimulus"

// <details> をメニュー外クリックで閉じる
export default class extends Controller {
  connect() {
    this.boundCloseOnClickOutside = this.closeOnClickOutside.bind(this)
    document.addEventListener("click", this.boundCloseOnClickOutside, true)
  }

  disconnect() {
    document.removeEventListener("click", this.boundCloseOnClickOutside, true)
  }

  closeOnClickOutside(event) {
    if (!this.element.hasAttribute("open")) return
    if (this.element.contains(event.target)) return
    this.element.removeAttribute("open")
  }
}
