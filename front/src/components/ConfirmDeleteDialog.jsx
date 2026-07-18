import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting,
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={description}
      contentClassName="sm:max-w-[400px]"
    >
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
