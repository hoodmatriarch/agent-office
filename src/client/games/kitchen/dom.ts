export function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
}
export function button(text: string, run: () => void, disabled = false) {
  const node = el('button', text); node.type = 'button'; node.disabled = disabled; node.onclick = run; return node;
}
