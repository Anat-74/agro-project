// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SAFETY_NOTE, dangerousTopicNote, isDangerousTopic } from "../server/utils/safety";

describe("isDangerousTopic", () => {
  it("распознаёт препараты и дозировки", () => {
    expect(isDangerousTopic("Сколько миллилитров инсектицида на литр воды?")).toBe(true);
    expect(isDangerousTopic("Дозировка гербицида для моркови")).toBe(true);
    expect(isDangerousTopic("Чем обработать химией томаты?")).toBe(true);
    expect(isDangerousTopic("Когда опрыскивать яблони?")).toBe(true);
    expect(isDangerousTopic("Средство от колорадского жука")).toBe(false);
    expect(isDangerousTopic("Пестициды для картофеля")).toBe(true);
  });

  it("не срабатывает на обычные агро-вопросы", () => {
    expect(isDangerousTopic("Чем подкормить томаты?")).toBe(false);
    expect(isDangerousTopic("Как поливать огурцы?")).toBe(false);
    expect(isDangerousTopic("Как хранить урожай яблок?")).toBe(false);
    expect(isDangerousTopic("")).toBe(false);
  });
});

describe("dangerousTopicNote", () => {
  it("возвращает инструкцию безопасности для опасного запроса", () => {
    expect(dangerousTopicNote("дозировка пестицида на литр")).toBe(SAFETY_NOTE);
  });

  it("пусто для безопасного запроса", () => {
    expect(dangerousTopicNote("чем подкормить томаты")).toBe("");
  });
});
