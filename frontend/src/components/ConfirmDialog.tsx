type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foam/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div className="animate-sheet relative z-10 mx-3 mb-[calc(1rem+env(safe-area-inset-bottom))] w-full max-w-sm rounded-3xl border border-line bg-panel p-4 shadow-2xl sm:mb-0">
        <p className="font-display text-lg font-bold text-foam">{title}</p>
        <p className="mt-2 text-sm text-mist">{message}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="native-btn bg-ink-soft text-mist">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`native-btn text-ink ${danger ? 'bg-expense' : 'bg-accent'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
