import { describe, expect, it } from 'vitest';
import { mapTreeData, searchTreeData } from '../../src/array/index.js';

describe('mapTreeData', () => {
  it('提取指定字段', () => {
    expect(mapTreeData([{ id: 1, name: 'a', code: 'x', extra: true }], ['id', 'name']))
      .toEqual([{ id: 1, name: 'a' }]);
  });

  it('递归提取子树节点', () => {
    expect(mapTreeData(
      [{ id: 1, name: 'a', children: [{ id: 2, name: 'b', extra: true }] }],
      ['id'],
      'children',
    )).toEqual([{ id: 1, children: [{ id: 2 }] }]);
  });

  it('空数组返回空数组', () => {
    expect(mapTreeData([])).toEqual([]);
  });

  it('非数组输入返回空数组', () => {
    expect(mapTreeData(undefined as any)).toEqual([]);
  });

  it('自定义 childrenKey', () => {
    expect(mapTreeData(
      [{ id: 1, name: 'a', items: [{ id: 2, name: 'b' }] }],
      ['id', 'name'],
      'items',
    )).toEqual([{ id: 1, name: 'a', items: [{ id: 2, name: 'b' }] }]);
  });

  it('叶子节点（无 children）不产生 children 字段', () => {
    expect(mapTreeData([{ id: 1, name: 'a' }], ['id', 'name']))
      .toEqual([{ id: 1, name: 'a' }]);
  });
});

describe('searchTreeData', () => {
  it('命中父节点时返回完整子树', () => {
    const tree = [
      {
        id: 1,
        name: '市场部',
        children: [{ id: 2, name: '销售组' }, { id: 3, name: '推广组' }],
      },
    ];
    expect(searchTreeData(tree, '市场', ['name'])).toEqual(tree);
  });

  it('命中子节点时保留父节点链路', () => {
    const tree = [
      {
        id: 1,
        name: '技术部',
        children: [
          { id: 2, name: '前端组' },
          { id: 3, name: '后端组' },
        ],
      },
    ];
    expect(searchTreeData(tree, '前端', ['name'])).toEqual([
      {
        id: 1,
        name: '技术部',
        children: [{ id: 2, name: '前端组' }],
      },
    ]);
  });

  it('空数组返回空数组', () => {
    expect(searchTreeData([])).toEqual([]);
  });

  it('非数组返回空数组', () => {
    expect(searchTreeData(undefined as any)).toEqual([]);
  });

  it('空关键字返回原树', () => {
    const tree = [{ id: 1, name: 'a' }];
    expect(searchTreeData(tree, '')).toEqual(tree);
  });

  it('空白关键字返回原树', () => {
    const tree = [{ id: 1, name: 'a' }];
    expect(searchTreeData(tree, '   ')).toEqual(tree);
  });

  it('空 searchFields 返回空数组', () => {
    expect(searchTreeData([{ id: 1, name: 'a' }], 'a', [])).toEqual([]);
  });

  it('无匹配返回空数组', () => {
    expect(searchTreeData([{ id: 1, name: 'a' }], '不存在', ['name'])).toEqual([]);
  });

  it('searchFields 支持单字符串', () => {
    expect(searchTreeData([{ id: 1, name: 'a' }], 'a', 'name'))
      .toEqual([{ id: 1, name: 'a' }]);
  });

  it('searchFields 支持多字段模糊匹配', () => {
    const tree = [
      { id: 1, code: 'ABC', name: 'a' },
      { id: 2, code: 'DEF', name: 'b' },
    ];
    expect(searchTreeData(tree, 'ABC', ['code', 'name']))
      .toEqual([{ id: 1, code: 'ABC', name: 'a' }]);
  });

  it('无 children 的节点不做递归', () => {
    expect(searchTreeData([{ id: 1, name: 'a' }], 'a', ['name']))
      .toEqual([{ id: 1, name: 'a' }]);
  });
});
