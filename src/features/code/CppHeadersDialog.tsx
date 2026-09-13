import {
  Button,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { Braces, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  createHeaderSource,
  defaultHeaderSources,
  headerSourcesAtom,
  type HeaderSource,
  validateHeaderSource,
} from './headers';

function updateSource(sources: HeaderSource[], id: string, patch: Partial<HeaderSource>) {
  return sources.map((source) => (source.id === id ? { ...source, ...patch } : source));
}

export function CppHeadersDialog() {
  const [sources, setSources] = useAtom(headerSourcesAtom);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HeaderSource[]>(sources);
  const errors = draft.map(validateHeaderSource);
  const canSave = errors.every((error) => error === undefined);

  const openDialog = () => {
    setDraft(sources);
    setOpen(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="ghost" onClick={openDialog} aria-label="Configure C++ headers">
          <Braces size={16} aria-hidden="true" />
          Headers
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl">
            <Dialog.Header>
              <Dialog.Title>C++ headers</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text textStyle="sm" color="fg.muted" mb="4">
                Headers are downloaded into clangd&apos;s browser-only virtual filesystem.
              </Text>
              <VStack align="stretch" gap="4">
                {draft.map((source, index) => (
                  <VStack key={source.id} align="stretch" gap="1" borderWidth="1px" rounded="md" p="3">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Header {index + 1}</Text>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={`Remove header ${index + 1}`}
                        onClick={() => setDraft((current) => current.filter((item) => item.id !== source.id))}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </IconButton>
                    </HStack>
                    <Input
                      value={source.url}
                      placeholder="https://example.com/include/api.h"
                      onChange={(event) =>
                        setDraft((current) => updateSource(current, source.id, { url: event.target.value }))
                      }
                    />
                    <Input
                      value={source.virtualPath}
                      placeholder="vendor/api.h"
                      onChange={(event) =>
                        setDraft((current) =>
                          updateSource(current, source.id, { virtualPath: event.target.value }),
                        )
                      }
                    />
                    {errors[index] ? (
                      <Text textStyle="xs" color="fg.error">
                        {errors[index]}
                      </Text>
                    ) : null}
                  </VStack>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  alignSelf="start"
                  onClick={() => setDraft((current) => [...current, createHeaderSource()])}
                >
                  <Plus size={14} aria-hidden="true" />
                  Add header
                </Button>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setDraft(defaultHeaderSources)}>
                <RotateCcw size={14} aria-hidden="true" />
                Restore SIECS
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="blue"
                disabled={!canSave}
                onClick={() => {
                  setSources(draft);
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
