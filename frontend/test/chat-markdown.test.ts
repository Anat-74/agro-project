// @vitest-environment node
import { describe, expect, it } from "vitest";
import { escapeHtml, renderInline, renderMarkdown } from "../app/utils/chatMarkdown";

describe("escapeHtml", () => {
  it("экранирует опасный HTML", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});

describe("renderInline", () => {
  it("делает bold, italic, code", () => {
    expect(renderInline("**жирный**")).toBe("<strong>жирный</strong>");
    expect(renderInline("*курсив*")).toBe("<em>курсив</em>");
    expect(renderInline("`код`")).toBe("<code>код</code>");
  });

  it("превращает http(s)-ссылку в <a>", () => {
    expect(renderInline("[сайт](https://example.com)")).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">сайт</a>',
    );
  });

  it("не делает ссылку из javascript:", () => {
    expect(renderInline("[x](javascript:alert(1))")).toBe("[x](javascript:alert(1))");
  });
});

describe("renderMarkdown", () => {
  it("заголовок, маркированный и нумерованный списки, абзац", () => {
    const html = renderMarkdown(escapeHtml("# Заголовок\n\n- один\n- два\n1. первый\n2. второй"));
    expect(html).toContain("<p><strong>Заголовок</strong></p>");
    expect(html).toContain("<ul><li>один</li><li>два</li></ul>");
    expect(html).toContain("<ol><li>первый</li><li>второй</li></ol>");
  });

  it("экранированный HTML остаётся текстом (нет XSS)", () => {
    const html = renderMarkdown(escapeHtml("<script>alert(1)</script>"));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("жирный внутри списка", () => {
    expect(renderMarkdown(escapeHtml("- **важно**"))).toBe("<ul><li><strong>важно</strong></li></ul>");
  });
});
