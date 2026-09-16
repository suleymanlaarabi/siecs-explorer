import { Box, IconButton, Spinner, Text } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser';
import { CloseAction, ErrorAction } from 'vscode-languageclient/lib/common/client';
import { initialize as initializeExtensions } from 'vscode/extensions';
import { initialize as initializeServices } from 'vscode/services';
import { useColorMode } from '../../components/ui/color-mode-hooks';
import { createCppWorkspace, headerSourcesAtom, loadWorkspaceHeaders } from './headers';
import { cppCodeAtom, useRunCppModule } from './runCpp';

type LspStatus = { tone: 'error' | 'success' | 'warning'; message: string };

let vscodeInitialization: Promise<void> | undefined;

const zedDarkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  colors: {
    'editor.background': '#111111',
    'editor.foreground': '#c5c8c6',
    'editorCursor.foreground': '#c5c8c6',
    'editorLineNumber.foreground': '#4f5866',
    'editorLineNumber.activeForeground': '#9da7b3',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#1d3a58',
    'editor.lineHighlightBackground': '#18181b',
    'editorIndentGuide.background1': '#1b2430',
    'editorIndentGuide.activeBackground1': '#2b3a4b',
    'editorBracketMatch.background': '#1e2937',
    'editorBracketMatch.border': '#46576a',
  },
  rules: [
    { token: 'keyword', foreground: 'ff934d' },
    { token: 'keyword.control', foreground: 'ff934d' },
    { token: 'keyword.operator', foreground: 'ff934d' },
    { token: 'keyword.directive', foreground: 'ff934d' },
    { token: 'keyword.directive.include', foreground: 'ff934d' },
    { token: 'keyword.directive.include.begin', foreground: 'ff934d' },
    { token: 'keyword.directive.include.end', foreground: 'ff934d' },
    { token: 'type', foreground: '4cc2ff' },
    { token: 'type.identifier', foreground: '4cc2ff' },
    { token: 'namespace', foreground: '4cc2ff' },
    { token: 'enum', foreground: '4cc2ff' },
    { token: 'function', foreground: 'f5c97b' },
    { token: 'method', foreground: 'f5c97b' },
    { token: 'parameter', foreground: 'c5c8c6' },
    { token: 'property', foreground: '7bdff2' },
    { token: 'macro', foreground: 'ff934d' },
    { token: 'predefined', foreground: '7bdff2' },
    { token: 'constant', foreground: 'b7a1ff' },
    { token: 'number', foreground: 'b7a1ff' },
    { token: 'number.float', foreground: 'b7a1ff' },
    { token: 'number.hex', foreground: 'b7a1ff' },
    { token: 'number.octal', foreground: 'b7a1ff' },
    { token: 'number.binary', foreground: 'b7a1ff' },
    { token: 'string', foreground: 'a8dcb5' },
    { token: 'string.escape', foreground: 'd7ba7d' },
    { token: 'comment', foreground: '697586', fontStyle: 'italic' },
    { token: 'comment.doc', foreground: '788697', fontStyle: 'italic' },
    { token: 'identifier', foreground: '4cc2ff' },
    { token: 'variable', foreground: 'c5c8c6' },
    { token: 'string.include.identifier', foreground: 'c5c8c6' },
    { token: 'delimiter', foreground: '8b96a5' },
    { token: 'delimiter.bracket', foreground: '8b96a5' },
    { token: 'delimiter.curly', foreground: '8b96a5' },
    { token: 'delimiter.parenthesis', foreground: '8b96a5' },
    { token: 'delimiter.square', foreground: '8b96a5' },
    { token: 'delimiter.angle', foreground: '8b96a5' },
  ],
};

monaco.editor.defineTheme('zed-dark', zedDarkTheme);

function initializeVscodeApi() {
  vscodeInitialization ??= (async () => {
    await initializeServices({});
    await initializeExtensions();
  })();
  return vscodeInitialization;
}

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

function waitForWorker(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<{ type?: string; message?: string }>) => {
      if (event.data.type === 'ready') {
        cleanup();
        resolve();
      } else if (event.data.type === 'error') {
        cleanup();
        reject(new Error(event.data.message ?? 'Unable to start clangd.'));
      }
    };
    const onError = () => {
      cleanup();
      reject(new Error('Unable to load the clangd worker.'));
    };
    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
  });
}

async function stopLanguageClient(client: MonacoLanguageClient | undefined) {
  if (client?.isRunning()) await client.stop();
}

type ClangdFileStatus = { uri: string; state: string };

function waitForClangdIdle(client: MonacoLanguageClient, uri: string) {
  let settled = false;
  let timeoutId: number | undefined;
  let rejectWait: (reason?: unknown) => void = () => undefined;
  let disposeNotification: (() => void) | undefined;

  const cleanup = () => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    disposeNotification?.();
  };

  const promise = new Promise<void>((resolve, reject) => {
    rejectWait = reject;
    const disposable = client.onNotification(
      'textDocument/clangd.fileStatus',
      (fileStatus: ClangdFileStatus) => {
        if (fileStatus.uri !== uri || fileStatus.state.toLowerCase() !== 'idle') return;
        settled = true;
        cleanup();
        resolve();
      },
    );
    disposeNotification = () => disposable.dispose();
    timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('clangd did not finish preparing the C++ file within 30 seconds.'));
    }, 30_000);
  });

  return {
    promise,
    cancel: () => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectWait(new Error('clangd startup was cancelled.'));
    },
  };
}

export function CppEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
  const modelRef = useRef<monaco.editor.ITextModel | undefined>(undefined);
  const clientRef = useRef<MonacoLanguageClient | undefined>(undefined);
  const [editorReady, setEditorReady] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);
  const [status, setStatus] = useState<LspStatus>({
    tone: 'warning',
    message: 'Starting C++ editor…',
  });
  const headerSources = useAtomValue(headerSourcesAtom);
  const setCppCode = useSetAtom(cppCodeAtom);
  const { pending: runPending, run } = useRunCppModule();
  const { colorMode } = useColorMode();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    let model: monaco.editor.ITextModel | undefined;

    void (async () => {
      try {
        await initializeVscodeApi();
        if (disposed) return;
        const initialFile = createCppWorkspace([]).find((file) => file.path.endsWith('main.cpp'));
        if (!initialFile) throw new Error('The C++ workspace is missing main.cpp.');

        model = monaco.editor.createModel(
          initialFile.content,
          'cpp',
          monaco.Uri.file('/workspace/main.cpp'),
        );
        setCppCode(initialFile.content);
        model.onDidChangeContent(() => setCppCode(model?.getValue() ?? ''));
        editor = monaco.editor.create(container, {
          model,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          bracketPairColorization: { enabled: true },
          quickSuggestionsDelay: 0,
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          suggest: { showWords: true, showSnippets: true },
          wordBasedSuggestions: true,
          inlayHints: { enabled: 'off' },
          links: false,
          'semanticHighlighting.enabled': true,
          minimap: { enabled: false },
          readOnly: true,
        });
        editorRef.current = editor;
        modelRef.current = model;
        setEditorReady(true);
      } catch (error: unknown) {
        if (!disposed) {
          setStatus({
            tone: 'error',
            message:
              error instanceof Error ? error.message : 'Unable to initialize the C++ editor.',
          });
        }
      }
    })();

    return () => {
      disposed = true;
      setEditorReady(false);
      void stopLanguageClient(clientRef.current);
      clientRef.current = undefined;
      editor?.dispose();
      model?.dispose();
      editorRef.current = undefined;
      modelRef.current = undefined;
    };
  }, [setCppCode]);

  useEffect(() => {
    editorRef.current?.updateOptions({
      theme: colorMode === 'dark' ? 'zed-dark' : 'vs',
      readOnly: !languageReady,
    });
  }, [colorMode, editorReady, languageReady]);

  useEffect(() => {
    const model = modelRef.current;
    if (!editorReady || !model) return;
    let cancelled = false;
    let worker: Worker | undefined;
    let port: MessagePort | undefined;
    let idleWait: ReturnType<typeof waitForClangdIdle> | undefined;
    const previousClient = clientRef.current;
    clientRef.current = undefined;
    setLanguageReady(false);

    const startLanguageClient = async () => {
      setStatus({ tone: 'warning', message: 'Loading C++ headers…' });
      const loadedHeaders = await loadWorkspaceHeaders(headerSources);
      if (cancelled) return;
      if (loadedHeaders.failures.length > 0) {
        throw new Error(loadedHeaders.failures.map((failure) => failure.message).join('\n'));
      }

      setStatus({ tone: 'warning', message: 'Starting C++ language service…' });
      worker = new Worker(new URL('./clangd.worker.ts', import.meta.url), { type: 'module' });
      const channel = new MessageChannel();
      port = channel.port1;
      worker.postMessage(
        { type: 'bootstrap', port: channel.port2, files: createCppWorkspace(loadedHeaders.files) },
        [channel.port2],
      );
      await waitForWorker(worker);
      if (cancelled) return;
      const languagePort = port;
      if (!languagePort) throw new Error('The clangd message port was not created.');

      const client = new MonacoLanguageClient({
        name: 'clangd',
        clientOptions: {
          documentSelector: ['cpp'],
          initializationOptions: { clangdFileStatus: true },
          errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart }),
          },
        },
        connectionProvider: {
          get: async () => ({
            reader: new BrowserMessageReader(languagePort),
            writer: new BrowserMessageWriter(languagePort),
          }),
        },
      });
      clientRef.current = client;
      idleWait = waitForClangdIdle(client, model.uri.toString());
      await client.start();
      if (cancelled) {
        idleWait.cancel();
        await stopLanguageClient(client);
        return;
      }
      setStatus({ tone: 'warning', message: 'Preparing C++ completion…' });
      await idleWait.promise;
      if (cancelled) return;
      setLanguageReady(true);
      setStatus({ tone: 'success', message: 'C++23 language service ready.' });
    };

    void (async () => {
      try {
        await stopLanguageClient(previousClient);
        await startLanguageClient();
      } catch (error: unknown) {
        idleWait?.cancel();
        if (!cancelled) {
          void stopLanguageClient(clientRef.current);
          clientRef.current = undefined;
          port?.close();
          worker?.terminate();
          setStatus({
            tone: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'C++ language service is unavailable. Add the clangd bundle under public/clangd/.',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      idleWait?.cancel();
      setLanguageReady(false);
      void stopLanguageClient(clientRef.current);
      clientRef.current = undefined;
      port?.close();
      worker?.terminate();
    };
  }, [editorReady, headerSources]);


  return (
    <Box position="relative" boxSize="full" minH={0} overflow="hidden">
      <Box
        ref={containerRef}
        bgColor={colorMode === 'dark' ? '#111111' : '#ffffff'}
        p={0}
        py={6}
        boxSize="full"
        minH={0}
        visibility={languageReady ? 'visible' : 'hidden'}
        pointerEvents={languageReady ? 'auto' : 'none'}
        aria-hidden={!languageReady}
      />
      {!languageReady ? (
        <Box
          position="absolute"
          inset="0"
          zIndex="2"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="3"
          bg={colorMode === 'dark' ? '#111111' : '#ffffff'}
          role={status.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status.tone === 'warning' ? <Spinner size="xl" /> : null}
          <Text textAlign="center" whiteSpace="pre-wrap" color={`fg.${status.tone}`}>
            {status.message}
          </Text>
        </Box>
      ) : null}
      <IconButton
        position="absolute"
        variant="outline"
        top="2"
        right="3"
        zIndex="1"
        size="sm"
        title="Compile and run C++ module"
        disabled={!languageReady || runPending}
        onClick={() => void run()}
      >
        {runPending ? <Spinner size="sm" /> : <Play />}
      </IconButton>
    </Box>
  );
}
