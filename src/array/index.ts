/**
 * 递归提取树结构，只保留指定字段。
 *
 * @param treeData - 树形数据源（默认 `[]`）
 * @param fields - 需要保留的字段列表（默认 `['id', 'name']`）
 * @param childrenKey - 下级节点字段名（默认 `'children'`）
 * @returns 提取后的树形结构数据
 * @example
 * mapTreeData([{ id: 1, name: 'a', code: 'x', extra: true }], ['id', 'name'])
 * // => [{ id: 1, name: 'a' }]
 *
 * mapTreeData([{ id: 1, children: [{ id: 2, name: 'b' }] }], ['id'], 'children')
 * // => [{ id: 1, children: [{ id: 2 }] }]
 */
export function mapTreeData(
  treeData: Record<string, any>[] = [],
  fields: string[] = ['id', 'name'],
  childrenKey: string = 'children',
): Record<string, any>[] {
  if (!Array.isArray(treeData) || treeData.length === 0) {
    return [];
  }

  return treeData.map((node) => {
    const currentNode: Record<string, any> = {}
    fields.forEach((field) => {
      currentNode[field] = node[field];
    })

    const children = node[childrenKey];
    if (Array.isArray(children) && children.length > 0) {
      currentNode[childrenKey] = mapTreeData(children, fields, childrenKey);
    }

    return currentNode;
  })
}

/**
 * 搜索树结构，命中子节点时保留父节点链路，命中父节点时返回完整子树。
 *
 * @param treeData - 树形数据源（默认 `[]`）
 * @param keyword - 搜索关键字（默认 `''`）
 * @param searchFields - 需要搜索的字段名，可传单个字符串或数组（默认 `['name']`）
 * @param childrenKey - 下级节点字段名（默认 `'children'`）
 * @returns 筛选后的树形结构数据
 * @example
 * searchTreeData([{ id: 1, name: '市场部' }], '市场', ['name'])
 * // => [{ id: 1, name: '市场部' }]
 *
 * searchTreeData([{ id: 1, name: 'a', children: [{ id: 2, name: '目标' }] }], '目标', ['name'])
 * // => [{ id: 1, name: 'a', children: [{ id: 2, name: '目标' }] }]
 */
export function searchTreeData(
  treeData: Record<string, any>[] = [],
  keyword: string = '',
  searchFields: string | string[] = ['name'],
  childrenKey: string = 'children',
): Record<string, any>[] {
  if (!Array.isArray(treeData) || treeData.length === 0) {
    return [];
  }

  const fieldList = Array.isArray(searchFields) ? searchFields : [searchFields];
  if (fieldList.length === 0) {
    return [];
  }

  if (!keyword) {
    return treeData;
  }

  const formatKeyword = keyword.trim();
  if (!formatKeyword) {
    return treeData;
  }

  const isMatchedNode = (node: Record<string, any>): boolean =>
    fieldList.some((field) => {
      const fieldValue = node[field];
      return fieldValue != null && String(fieldValue).includes(formatKeyword);
    })

  const cloneTreeNode = (node: Record<string, any>): Record<string, any> => {
    const children = node[childrenKey];
    return Array.isArray(children) && children.length > 0
      ? { ...node, [childrenKey]: children.map((child) => cloneTreeNode(child)) }
      : { ...node }
  }

  const loop = (nodes: Record<string, any>[]): Record<string, any>[] =>
    nodes.reduce<Record<string, any>[]>((result, node) => {
      if (isMatchedNode(node)) {
        result.push(cloneTreeNode(node));
        return result;
      }

      const children = node[childrenKey];
      if (Array.isArray(children) && children.length > 0) {
        const matchedChildren = loop(children);
        if (matchedChildren.length > 0) {
          result.push({ ...node, [childrenKey]: matchedChildren });
        }
      }

      return result;
    }, []);

  return loop(treeData);
}
