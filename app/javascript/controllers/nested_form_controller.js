import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "template", "field"]

  add(e) {
    e.preventDefault()
    const content = this.templateTarget.innerHTML.replace(/NEW_RECORD/g, new Date().getTime())
    this.containerTarget.insertAdjacentHTML("beforeend", content)
  }

  remove(e) {
    e.preventDefault()
    const field = e.target.closest("[data-nested-form-target='field']")
    const destroyInput = field.querySelector("input[name*='_destroy']")

    if (destroyInput) {
      destroyInput.value = "1"
      field.style.display = "none"
    } else {
      field.remove()
    }
  }
}
