import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';

export function MutationDialog({
  title,
  trigger,
  children,
  pending,
  canSubmit,
  submit,
  submitLabel = 'Add',
  onClose,
}: {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
  pending: boolean;
  canSubmit: boolean;
  submit: () => Promise<void>;
  submitLabel?: string;
  onClose?: (() => void) | undefined;
}) {
  const [open, setOpen] = useState(false);
  const close = (nextOpen: boolean) => {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(details) => close(details.open)}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" disabled={pending}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                loading={pending}
                disabled={!canSubmit}
                onClick={async () => {
                  try {
                    await submit();
                    close(false);
                  } catch {
                    // The mutation owns error reporting; keep the dialog open.
                  }
                }}
              >
                {submitLabel}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={pending} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
