import { Button, CloseButton, Dialog, HStack, IconButton, Portal, Text } from "@chakra-ui/react";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toaster } from "../../components/ui/toaster-provider";
import { Tooltip } from "./tooltip";
import { useSceneActions } from "./hooks/useSceneActions";

export function SceneActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const { saveScene, loadScene, isSaving, isLoading, isBusy } = useSceneActions();

  const clearFile = () => setFile(undefined);

  return (
    <>
      <HStack gap="1">
        <Tooltip content="Save scene">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Save scene"
            loading={isSaving}
            disabled={isBusy}
            onClick={() => {
              void saveScene().catch(() => {
                // The hook owns error reporting.
              });
            }}
          >
            <Download aria-hidden="true" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Load scene">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Load scene"
            loading={isLoading}
            disabled={isBusy}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
                fileInputRef.current.click();
              }
            }}
          >
            <Upload aria-hidden="true" />
          </IconButton>
        </Tooltip>
      </HStack>
      <input
        ref={fileInputRef}
        type="file"
        accept=".siecs,application/octet-stream"
        hidden
        onChange={(event) => {
          const selectedFile = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!selectedFile) return;
          if (selectedFile.size === 0) {
            toaster.create({ title: "Invalid scene file", type: "error", closable: true });
            return;
          }
          setFile(selectedFile);
        }}
      />
      <Dialog.Root
        open={file !== undefined}
        onOpenChange={(details) => {
          if (!isLoading && !details.open) clearFile();
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="sm">
              <Dialog.Header>
                <Dialog.Title>Load scene</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {file ? (
                  <HStack align="start" justify="space-between" gap="4">
                    <Text fontWeight="medium" overflow="hidden" textOverflow="ellipsis">
                      {file.name}
                    </Text>
                    <Text color="fg.muted" whiteSpace="nowrap">
                      {formatFileSize(file.size)}
                    </Text>
                  </HStack>
                ) : null}
                <Text mt="4" color="fg.muted">
                  This will instantiate the saved scene into the current world. Existing entities
                  will not be removed.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" disabled={isLoading} onClick={clearFile}>
                  Cancel
                </Button>
                <Button
                  colorPalette="blue"
                  loading={isLoading}
                  disabled={!file || isBusy}
                  onClick={async () => {
                    if (!file) return;
                    try {
                      await loadScene(file);
                      clearFile();
                    } catch {
                      // The hook reports the error and keeps the dialog usable.
                    }
                  }}
                >
                  Load
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" disabled={isLoading} />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
