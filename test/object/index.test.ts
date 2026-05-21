import { describe, expect, it } from 'vitest';
import { omitNil, omitBlank } from '../../src/object/index.js';

describe('omitNil', () => {
  it('移除值为 null 的属性', () => {
    expect(omitNil({ a: 1, b: null, c: 2 })).toEqual({ a: 1, c: 2 });
  });

  it('移除值为 undefined 的属性', () => {
    expect(omitNil({ a: 1, b: undefined, c: 2 })).toEqual({ a: 1, c: 2 });
  });

  it('同时移除 null 和 undefined', () => {
    expect(omitNil({ a: null, b: undefined, c: 'hello', d: 0 })).toEqual({ c: 'hello', d: 0 });
  });

  it('保留空字符串、0、false 等 falsy 值', () => {
    expect(omitNil({ a: '', b: 0, c: false, d: null })).toEqual({ a: '', b: 0, c: false });
  });

  it('空对象返回空对象', () => {
    expect(omitNil({})).toEqual({});
  });

  it('所有值均为空时返回空对象', () => {
    expect(omitNil({ a: null, b: undefined })).toEqual({});
  });

  it('嵌套对象不做深层处理', () => {
    expect(omitNil({ a: { b: null, c: 1 } })).toEqual({ a: { b: null, c: 1 } });
  });
});

describe('omitBlank', () => {
  it('移除值为 null 的属性', () => {
    expect(omitBlank({ a: 1, b: null, c: 2 })).toEqual({ a: 1, c: 2 });
  });

  it('移除值为 undefined 的属性', () => {
    expect(omitBlank({ a: 1, b: undefined, c: 2 })).toEqual({ a: 1, c: 2 });
  });

  it('移除值为空字符串的属性', () => {
    expect(omitBlank({ a: 1, b: '', c: 'hello' })).toEqual({ a: 1, c: 'hello' });
  });

  it('同时移除 null、undefined 和空字符串', () => {
    expect(omitBlank({ a: null, b: undefined, c: '', d: 0, e: false })).toEqual({ d: 0, e: false });
  });

  it('保留 0、false 等 falsy 值', () => {
    expect(omitBlank({ a: 0, b: false, c: '' })).toEqual({ a: 0, b: false });
  });

  it('空对象返回空对象', () => {
    expect(omitBlank({})).toEqual({});
  });

  it('嵌套对象不做深层处理', () => {
    expect(omitBlank({ a: { b: null, c: '' } })).toEqual({ a: { b: null, c: '' } });
  });
});
