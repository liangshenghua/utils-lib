# utils-lib

个人工具函数库模板。使用 `TypeScript + Vitest + tsup`，包管理器使用 `pnpm`。

## 技术栈

| 工具     | 用途                   |
| -------- | ---------------------- |
| TypeScript | 类型安全               |
| Vitest     | 单元测试               |
| tsup       | 构建 ESM / CJS / dts 产物 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 构建
pnpm build

# 生成 API 文档
pnpm docs

# 开发模式（监听文件变化自动构建）
pnpm dev
```

## 目录结构

```
src/             # 源码目录
  string/        # 按类别分组
    capitalize.ts
  index.ts       # 统一导出入口
test/            # 测试目录（与 src 保持镜像结构）
  string/
    capitalize.test.ts
dist/            # 构建产物（由 pnpm build 生成）
docs/            # API 文档（由 pnpm docs 生成）
```

## 文档

项目使用 [TypeDoc](https://typedoc.org/) 自动从源码 JSDoc 注释生成 API 文档。

```bash
pnpm docs
```

生成后打开 `docs/index.html` 即可查看所有函数的分组文档（String / Array / Object / Browser / Time 等），支持搜索和深色/浅色主题切换。

> 配置见项目根目录 `typedoc.json`，使用 `expand` 策略按源文件目录进行模块分组。

## 如何新增一个工具

1. 在 `src/<类别>/` 下新建函数文件，使用命名导出
2. 在 `src/index.ts` 中导出该函数
3. 在 `test/` 下对应的类别目录中补充测试
4. 运行 `pnpm test` 确保测试通过
5. 运行 `pnpm build` 构建产物

### 示例

```typescript
import { capitalize } from 'utils-lib';

capitalize('hello'); // => 'Hello'
```

## 使用方式

### ESM（推荐）

```typescript
import { capitalize } from 'utils-lib';

capitalize('hello'); // => 'Hello'
```

### CommonJS

```javascript
const { capitalize } = require('utils-lib');
```

### 浏览器直接引用

将 `dist/index.global.js` 复制到项目中，通过 `<script>` 标签引入，所有函数暴露在全局 `utilsLib` 对象下：

```html
<script src="path/to/index.global.js"></script>
<script>
  utilsLib.capitalize('hello'); // => 'Hello'
</script>
```

## 构建产物

`pnpm build` 会生成：

| 文件                   | 格式     | 使用方式                   |
| ---------------------- | -------- | -------------------------- |
| `dist/index.js`        | ES Module | `import`                  |
| `dist/index.cjs`       | CommonJS  | `require`                 |
| `dist/index.global.js` | IIFE      | `<script>` 标签直接引用   |
| `dist/index.d.ts`      | 类型声明  | TypeScript 类型提示       |
