import { Button, CloseButton, Dialog, IconButton, Menu, Portal, Text } from "@chakra-ui/react";
import { EllipsisVertical, Trash2 } from "lucide-react";
import { useState } from "react";

export function ConfirmDeleteAction({
  subject,
  title,
  description,
  pending,
  onConfirm,
}: {
  subject: string;
  title: string;
  description: string;
  pending: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={`Actions for ${subject}`}
            disabled={pending}
          >
            <EllipsisVertical size={14} aria-hidden="true" />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="remove" color="fg.error" onClick={() => setOpen(true)}>
                <Trash2 size={14} aria-hidden="true" />
                Remove {subject.startsWith("component") ? "component" : "relation"}
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <Dialog.Root open={open} onOpenChange={(details) => !pending && setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="sm">
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color="fg.muted">{description}</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  loading={pending}
                  onClick={async () => {
                    try {
                      await onConfirm();
                      setOpen(false);
                    } catch {
                      // Keep the confirmation open after a failed mutation.
                    }
                  }}
                >
                  Remove
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" disabled={pending} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
