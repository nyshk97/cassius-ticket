import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "display"]

  connect() {
    this.updateDisplay()
    this.inputTarget.addEventListener("change", () => this.updateDisplay())
  }

  increment() {
    const value = parseInt(this.inputTarget.value, 10) || 0
    this.inputTarget.value = value + 1
    this.updateDisplay()
  }

  decrement() {
    const value = parseInt(this.inputTarget.value, 10) || 0
    if (value > 0) {
      this.inputTarget.value = value - 1
      this.updateDisplay()
    }
  }

  updateDisplay() {
    if (this.hasDisplayTarget) {
      this.displayTarget.textContent = this.inputTarget.value || 0
    }
  }
}
