import { describe, expect, it, vi, afterEach } from 'vitest';
import { copyToClipboard } from '../../src/browser/copyToClipboard.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function createMockDocument(execCommand: ReturnType<typeof vi.fn>) {
  class MockTextarea {
    _value = '';
    style: Record<string, string> = {};
    select = vi.fn();
    get value() { return this._value; }
    set value(v: string) { this._value = v; }
  }
  return {
    createElement: () => new MockTextarea(),
    body: { appendChild: vi.fn(), removeChild: vi.fn() },
    execCommand,
  };
}

describe('copyToClipboard', () => {
  it('使用 Clipboard API 复制成功', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('Clipboard API 不可用时降级到 execCommand', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { clipboard: undefined });
    vi.stubGlobal('document', createMockDocument(execCommand));

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
  });

  it('Clipboard API 报错时降级到 execCommand', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal('document', createMockDocument(execCommand));

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalled();
  });

  it('execCommand 失败时返回 false', async () => {
    const execCommand = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { clipboard: undefined });
    vi.stubGlobal('document', createMockDocument(execCommand));

    const result = await copyToClipboard('hello');
    expect(result).toBe(false);
  });

  it('SSR 环境无 navigator 且无 document 返回 false', async () => {
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('document', undefined);

    const result = await copyToClipboard('hello');
    expect(result).toBe(false);
  });

  it('SSR 环境无 navigator 但有 document 走 fallback', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('document', createMockDocument(execCommand));

    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
  });
});
