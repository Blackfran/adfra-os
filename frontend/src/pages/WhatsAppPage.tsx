import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { api, type BorradorWhatsApp } from '../lib/api'
import {
  buildWhatsAppMessage,
  prefixLines,
  previewHtml,
  whatsappSendUrl,
  wrapSelection,
} from '../lib/whatsappFormat'

export function WhatsAppPage() {
  const [items, setItems] = useState<BorradorWhatsApp[]>([])
  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [editing, setEditing] = useState<BorradorWhatsApp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const load = () => api.whatsapp().then(setItems).catch((e: Error) => setError(e.message))

  useEffect(() => {
    void load()
  }, [])

  const mensajeFinal = buildWhatsAppMessage(titulo, subtitulo, cuerpo)
  const canSend = Boolean(mensajeFinal.trim())

  function resetForm() {
    setTitulo('')
    setSubtitulo('')
    setCuerpo('')
    setTelefono('')
    setEditing(null)
    setError(null)
  }

  function openEdit(item: BorradorWhatsApp) {
    setEditing(item)
    setTitulo(item.titulo)
    setSubtitulo(item.subtitulo || '')
    setCuerpo(item.cuerpo)
    setTelefono(item.telefono || '')
    setMsg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !cuerpo.trim()) {
      setError('Completa el título y el cuerpo del mensaje')
      return
    }
    setError(null)
    const payload = {
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim() || null,
      cuerpo: cuerpo.trim(),
      telefono: telefono.trim() || null,
    }
    if (editing) await api.updateWhatsapp(editing.id, payload)
    else await api.createWhatsapp(payload)
    setMsg(editing ? 'Cambios guardados' : 'Borrador guardado')
    resetForm()
    await load()
  }

  function applyWrap(before: string, after?: string) {
    const el = areaRef.current
    if (!el) return
    const next = wrapSelection(cuerpo, el.selectionStart, el.selectionEnd, before, after ?? before)
    setCuerpo(next.value)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(next.start, next.end)
    })
  }

  function applyPrefix(prefix: string) {
    const el = areaRef.current
    if (!el) return
    const next = prefixLines(cuerpo, el.selectionStart, el.selectionEnd, prefix)
    setCuerpo(next.value)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(next.start, next.end)
    })
  }

  async function copiar(text = mensajeFinal) {
    if (!text.trim()) return
    await navigator.clipboard.writeText(text)
    setMsg('Mensaje copiado al portapapeles')
  }

  function enviar(text = mensajeFinal, phone = telefono) {
    if (!text.trim()) {
      setError('Escribe el mensaje antes de enviar')
      return
    }
    window.open(whatsappSendUrl(text, phone), '_blank', 'noopener,noreferrer')
  }

  async function confirmarDelete() {
    if (deleteId == null) return
    await api.deleteWhatsapp(deleteId)
    if (editing?.id === deleteId) resetForm()
    setDeleteId(null)
    setMsg('Borrador eliminado')
    await load()
  }

  return (
    <div className="page space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#25D366] text-sm font-bold text-ink">
            WA
          </span>
          <div className="min-w-0">
            <h1 className="page-title">WhatsApp</h1>
            <p className="text-sm text-mist">Redacta, formatea y envía sin pelearte con los signos</p>
          </div>
        </div>
      </header>

      {(error || msg) && (
        <p className={`text-sm font-semibold ${error ? 'text-expense' : 'text-income'}`}>{error || msg}</p>
      )}

      <form onSubmit={onSave} className="space-y-4">
        <section className="native-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foam">{editing ? 'Editando borrador' : 'Nuevo mensaje'}</p>
            {editing && (
              <button type="button" onClick={resetForm} className="text-xs font-bold text-accent">
                Nuevo en blanco
              </button>
            )}
          </div>

          <Field label="Título">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Cotización sitio web"
              className="native-input"
              required
            />
          </Field>
          <Field label="Subtítulo (opcional)">
            <input
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ej. Propuesta para Cliente X"
              className="native-input"
            />
          </Field>
          <Field label="Teléfono (opcional)">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="584121234567"
              className="native-input"
              inputMode="tel"
            />
          </Field>
        </section>

        <section className="native-card overflow-hidden">
          <div className="border-b border-line bg-ink-soft/70 px-3 py-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Formato</p>
              <p className="text-[10px] font-medium text-mist/80">Desliza →</p>
            </div>
            <div className="chip-scroll -mx-1 px-1">
              <Tool label="Negrita" onClick={() => applyWrap('*')} />
              <Tool label="Cursiva" onClick={() => applyWrap('_')} />
              <Tool label="Tachado" onClick={() => applyWrap('~')} />
              <Tool label="Código" onClick={() => applyWrap('```', '```')} />
              <Tool label="Viñeta" onClick={() => applyPrefix('• ')} />
              <Tool label="Lista" onClick={() => applyPrefix('1. ')} />
              <Tool label="Cita" onClick={() => applyPrefix('> ')} />
            </div>
          </div>

          <div className="space-y-0 p-0 md:grid md:grid-cols-2 md:divide-x md:divide-line">
            <div className="p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-mist">Escribir</p>
              <textarea
                ref={areaRef}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder={'Selecciona texto y usa los botones de formato.\n\n• Punto uno\n• Punto dos\n\n*Total:* $500'}
                className="min-h-48 w-full resize-y rounded-2xl border border-line bg-canvas px-3 py-3 font-body text-[15px] leading-relaxed text-foam outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(109,40,217,0.12)] md:min-h-64"
                required
              />
              <p className="mt-2 text-[11px] text-mist">
                Tip: selecciona una palabra y toca Negrita / Cursiva. WhatsApp no tiene subrayado.
              </p>
            </div>

            <div className="border-t border-line bg-[#efeae2] p-3 md:border-t-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#667781]">
                Cómo se verá
              </p>
              <div className="wa-chat-bg rounded-2xl p-3">
                <div className="wa-bubble ml-auto max-w-[92%]">
                  {canSend ? (
                    <div
                      className="wa-bubble-text"
                      dangerouslySetInnerHTML={{ __html: previewHtml(mensajeFinal) }}
                    />
                  ) : (
                    <p className="text-sm text-[#667781]">La vista previa aparece al escribir…</p>
                  )}
                  <p className="wa-time">AdFra Ges</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="submit" className="native-btn bg-accent text-ink">
            {editing ? 'Guardar cambios' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void copiar()}
            className="native-btn bg-ink-soft text-foam disabled:opacity-40"
          >
            Copiar texto
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => enviar()}
            className="native-btn bg-[#25D366] font-bold text-ink disabled:opacity-40"
          >
            Enviar por WhatsApp
          </button>
        </section>
      </form>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Guardados</h2>
          <span className="text-xs text-mist">{items.length}</span>
        </div>

        {items.map((item) => (
          <article key={item.id} className="native-card overflow-hidden">
            <div className="space-y-2 p-3">
              <div className="row-between items-start">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foam">{item.titulo}</p>
                  {item.subtitulo ? <p className="truncate text-xs text-mist">{item.subtitulo}</p> : null}
                  {item.telefono ? (
                    <p className="mt-1 text-[11px] font-semibold text-accent">{item.telefono}</p>
                  ) : null}
                </div>
              </div>
              <div className="wa-chat-bg rounded-xl p-2.5">
                <div className="wa-bubble max-w-full">
                  <div
                    className="wa-bubble-text line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: previewHtml(item.mensaje_final) }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 border-t border-line">
              <Action onClick={() => openEdit(item)} label="Editar" />
              <Action onClick={() => setDeleteId(item.id)} label="Borrar" tone="text-expense" />
              <Action onClick={() => void copiar(item.mensaje_final)} label="Copiar" />
              <Action
                onClick={() => enviar(item.mensaje_final, item.telefono || '')}
                label="Enviar"
                tone="text-[#128C7E]"
              />
            </div>
          </article>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-panel/60 px-4 py-8 text-center">
            <p className="font-semibold text-foam">Sin borradores</p>
            <p className="mt-1 text-sm text-mist">Escribe arriba, guarda y tendrás el historial aquí.</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteId != null}
        title="Eliminar borrador"
        message="¿Seguro que quieres eliminar este borrador? No se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="No"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmarDelete()}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-mist">{label}</span>
      {children}
    </label>
  )
}

function Tool({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 snap-start rounded-xl bg-panel px-3.5 py-2.5 text-xs font-bold text-foam shadow-sm ring-1 ring-line active:scale-95"
    >
      {label}
    </button>
  )
}

function Action({
  label,
  onClick,
  tone = 'text-foam',
}: {
  label: string
  onClick: () => void
  tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 text-xs font-bold ${tone} hover:bg-ink-soft`}
    >
      {label}
    </button>
  )
}
