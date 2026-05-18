import { describe, expect, it } from 'vitest';
import {
  buildCommitMessage,
  parseCommitMessage,
  validateCommitMessage,
} from '../../src/git/commit.js';

describe('buildCommitMessage', () => {
  it('构建基础提交信息', () => {
    expect(buildCommitMessage({ type: 'feat', subject: 'add login' })).toBe(
      'feat: add login',
    );
  });

  it('包含 scope', () => {
    expect(
      buildCommitMessage({ type: 'fix', scope: 'core', subject: 'fix crash' }),
    ).toBe('fix(core): fix crash');
  });

  it('标记破坏性变更', () => {
    expect(
      buildCommitMessage({ type: 'feat', subject: 'rewrite engine', breaking: true }),
    ).toBe('feat!: rewrite engine');
  });

  it('scope + breaking 组合', () => {
    expect(
      buildCommitMessage({
        type: 'refactor',
        scope: 'api',
        subject: 'restructure',
        breaking: true,
      }),
    ).toBe('refactor(api)!: restructure');
  });

  it('包含 body', () => {
    const result = buildCommitMessage({
      type: 'feat',
      subject: 'add payment',
      body: 'Implement Stripe integration',
    });
    expect(result).toBe('feat: add payment\n\nImplement Stripe integration');
  });

  it('包含 footer', () => {
    const result = buildCommitMessage({
      type: 'fix',
      subject: 'fix timeout',
      footer: 'Closes #42',
    });
    expect(result).toBe('fix: fix timeout\n\nCloses #42');
  });

  it('body + footer 同时存在', () => {
    const result = buildCommitMessage({
      type: 'feat',
      subject: 'add search',
      body: 'Full-text search using Elasticsearch',
      footer: 'Closes #100',
    });
    expect(result).toBe(
      'feat: add search\n\nFull-text search using Elasticsearch\n\nCloses #100',
    );
  });
});

describe('parseCommitMessage', () => {
  it('解析基础格式', () => {
    expect(parseCommitMessage('feat: add login')).toEqual({
      type: 'feat',
      scope: undefined,
      breaking: false,
      subject: 'add login',
      body: undefined,
      footer: undefined,
    });
  });

  it('解析包含 scope', () => {
    expect(parseCommitMessage('fix(core): fix crash')).toEqual({
      type: 'fix',
      scope: 'core',
      breaking: false,
      subject: 'fix crash',
      body: undefined,
      footer: undefined,
    });
  });

  it('解析 breaking change', () => {
    expect(parseCommitMessage('feat!: rewrite engine')).toEqual({
      type: 'feat',
      scope: undefined,
      breaking: true,
      subject: 'rewrite engine',
      body: undefined,
      footer: undefined,
    });
  });

  it('解析 scope + breaking', () => {
    expect(parseCommitMessage('refactor(api)!: restructure')).toEqual({
      type: 'refactor',
      scope: 'api',
      breaking: true,
      subject: 'restructure',
      body: undefined,
      footer: undefined,
    });
  });

  it('解析带 body 的提交信息', () => {
    expect(
      parseCommitMessage('feat: add payment\n\nImplement Stripe integration'),
    ).toEqual({
      type: 'feat',
      scope: undefined,
      breaking: false,
      subject: 'add payment',
      body: 'Implement Stripe integration',
      footer: undefined,
    });
  });

  it('空字符串返回 null', () => {
    expect(parseCommitMessage('')).toBeNull();
  });

  it('非法格式返回 null', () => {
    expect(parseCommitMessage('just some random text')).toBeNull();
  });

  it('缺少冒号后空格也识别（宽松）', () => {
    const result = parseCommitMessage('feat:add login');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('feat');
    expect(result?.subject).toBe('add login');
  });
});

describe('validateCommitMessage', () => {
  it('有效的基础格式', () => {
    expect(validateCommitMessage('feat: add login')).toBe(true);
  });

  it('未知类型返回 false', () => {
    expect(validateCommitMessage('foo: bar')).toBe(false);
  });

  it('空字符串返回 false', () => {
    expect(validateCommitMessage('')).toBe(false);
  });

  it('自定义允许类型', () => {
    expect(validateCommitMessage('custom: hello', ['custom'])).toBe(true);
  });

  it('subject 为空字符串返回 false', () => {
    expect(validateCommitMessage('feat: ')).toBe(false);
  });
});
