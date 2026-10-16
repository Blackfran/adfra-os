/** Inserta marcadores de formato WhatsApp alrededor de la selección. */

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string = before,
): { value: string; start: number; end: number } {
  const selected = value.slice(start, end) || 'texto'
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  const selStart = start + before.length
  const selEnd = selStart + selected.length
  return { value: next, start: selStart, end: selEnd }
}

export function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): { value: string; start: number; end: number } {
  const from = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const to = value.indexOf('\n', end)
  const blockEnd = to === -1 ? value.length : to
  const block = value.slice(from, blockEnd)
  const lines = block.split('\n').map((line) => {
    const trimmed = line.trimStart()
    if (!trimmed) return prefix.trimEnd()
    if (trimmed.startsWith(prefix.trim())) return line
    return prefix + trimmed
  })
  const next = value.slice(0, from) + lines.join('\n') + value.slice(blockEnd)
  return { value: next, start: from, end: from + lines.join('\n').length }
}

export function buildWhatsAppMessage(titulo: string, subtitulo: string, cuerpo: string): string {
  const parts: string[] = []
  if (titulo.trim()) parts.push(`*${titulo.trim()}*`)
  if (subtitulo.trim()) parts.push(`_${subtitulo.trim()}_`)
  if (cuerpo.trim()) parts.push(cuerpo.trim())
  return parts.join('\n\n')
}

export function whatsappSendUrl(mensaje: string, telefono?: string): string {
  const text = encodeURIComponent(mensaje)
  const digits = (telefono || '').replace(/\D/g, '')
  if (digits) return `https://wa.me/${digits}?text=${text}`
  return `https://wa.me/?text=${text}`
}

/** Vista previa simple estilo chat (no perfecta, útil para revisar). */
export function previewHtml(text: string): string {
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/```([\s\S]*?)```/g, '<code class="wa-mono">$1</code>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<s>$1</s>')
    .replace(/^&gt; (.*)$/gm, '<span class="wa-quote">$1</span>')
    .replace(/\n/g, '<br/>')
}
