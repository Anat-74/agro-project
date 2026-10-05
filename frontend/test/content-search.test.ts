// @vitest-environment node
import { describe, expect, it } from "vitest";
import { orFilterParams, tokenize } from "../server/utils/content-search";

describe("tokenize", () => {
  it("берёт до 3 значимых слов, отбрасывает стоп-слова и короткие", () => {
    expect(tokenize("Как варить варенье из яблок?")).toEqual([
      "варить",
      "варенье",
      "яблок",
    ]);
  });

  it("убирает дубликаты", () => {
    expect(tokenize("яблоки яблоки")).toEqual(["яблоки"]);
  });

  it("пустой запрос — пустой список", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("регистр не важен", () => {
    expect(tokenize("ВАРЕНЬЕ")).toEqual(["варенье"]);
  });
});

describe("orFilterParams", () => {
  it("строит плоские $containsi-параметры по полям и словам", () => {
    expect(orFilterParams(["title"], ["варенье", "яблок"])).toEqual({
      "filters[$or][0][title][$containsi]": "варенье",
      "filters[$or][1][title][$containsi]": "яблок",
    });
  });

  it("перебирает поля × слова по порядку", () => {
    expect(orFilterParams(["name", "description"], ["томат"])).toEqual({
      "filters[$or][0][name][$containsi]": "томат",
      "filters[$or][1][description][$containsi]": "томат",
    });
  });
});
