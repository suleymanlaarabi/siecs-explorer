import { describe, expect, test } from 'bun:test';
import { createCppWorkspace, validateHeaderSource } from '../src/features/code/headers';

describe('C++ header workspace', () => {
  test('pins clangd to C++23 and exposes configured headers below the include root', () => {
    const workspace = createCppWorkspace([
      { path: '/workspace/include/siecs/siecs.h', content: 'void ecs_init(void);' },
    ]);

    const clangdConfig = workspace.find((file) => file.path === '/workspace/.clangd')?.content;
    expect(clangdConfig).toContain('-std=c++23');
    expect(clangdConfig).toContain('--target=wasm32-wasi');
    expect(clangdConfig).toContain('-isystem/usr/include/wasm32-wasi/c++/v1');
    expect(clangdConfig).toContain('-isystem/usr/include');
    expect(workspace.find((file) => file.path === '/workspace/main.cpp')?.content).toContain(
      '#include <siecs/siecs.h>',
    );
    expect(workspace.some((file) => file.path === '/workspace/include/siecs/siecs.h')).toBe(true);
  });

  test('rejects unsafe virtual paths and unsupported URL protocols', () => {
    expect(
      validateHeaderSource({ id: 'one', url: 'file:///tmp/api.h', virtualPath: 'vendor/api.h' }),
    ).toBeDefined();
    expect(
      validateHeaderSource({
        id: 'two',
        url: 'https://example.test/api.h',
        virtualPath: '../api.h',
      }),
    ).toBeDefined();
    expect(
      validateHeaderSource({
        id: 'three',
        url: 'https://example.test/api.h',
        virtualPath: 'vendor/api.h',
      }),
    ).toBeUndefined();
  });
});
