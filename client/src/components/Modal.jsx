export default function Modal({ open, title, onClose, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="modal-layer" onMouseDown={onClose}>
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