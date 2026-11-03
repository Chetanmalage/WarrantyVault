export default function Modal({ open, title, onClose, children, footer, wide, closeOnBackdrop = true }) {
  if (!open) return null;
  const onBackdrop = closeOnBackdrop ? onClose : undefined;
  return (
    <div className="modal-layer" onMouseDown={onBackdrop}>
      <div className={`modal-card ${wide ? 'wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h5>{title}</h5>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="modal-body-custom">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}