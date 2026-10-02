import { translatePhrase } from '../../i18n';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={loading ? () => {} : onClose}>
      <p className="text-sm leading-6 text-muted">{translatePhrase(description)}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant="danger" fullWidth={false} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
