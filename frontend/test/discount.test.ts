// @vitest-environment node
import { describe, expect, it } from "vitest";
import { discountPercent, finalPrice, hasDiscount } from "../shared/utils/discount";

describe("discountPercent", () => {
  it("без флага isDiscount скидки нет", () => {
    expect(discountPercent({ price: 100, discountPercent: 20 })).toBe(0);
  });

  it("флаг включён, процент есть", () => {
    expect(discountPercent({ price: 100, isDiscount: true, discountPercent: 15 })).toBe(15);
  });

  it("нулевой и запредельный проценты игнорируются", () => {
    expect(discountPercent({ price: 100, isDiscount: true, discountPercent: 0 })).toBe(0);
    expect(discountPercent({ price: 100, isDiscount: true, discountPercent: 100 })).toBe(0);
    expect(discountPercent({ price: 100, isDiscount: true, discountPercent: -5 })).toBe(0);
  });

  it("строковые значения из Strapi приводятся к числу", () => {
    expect(discountPercent({ price: "100", isDiscount: true, discountPercent: "20" })).toBe(20);
  });
});

describe("finalPrice", () => {
  it("без скидки — базовая цена", () => {
    expect(finalPrice({ price: 2 })).toBe(2);
    expect(finalPrice({ price: 1.99, isDiscount: false, discountPercent: 15 })).toBe(1.99);
  });

  it("15% от 2.00 = 1.70", () => {
    expect(finalPrice({ price: 2, isDiscount: true, discountPercent: 15 })).toBe(1.7);
  });

  it("округление до копеек: 1.99 при 15% = 1.69", () => {
    expect(finalPrice({ price: 1.99, isDiscount: true, discountPercent: 15 })).toBe(1.69);
  });

  it("строковая базовая цена тоже считается", () => {
    expect(finalPrice({ price: "100", isDiscount: true, discountPercent: 30 })).toBe(70);
  });
});

describe("hasDiscount", () => {
  it("true только когда цена реально ниже", () => {
    expect(hasDiscount({ price: 100, isDiscount: true, discountPercent: 20 })).toBe(true);
    expect(hasDiscount({ price: 100, isDiscount: true, discountPercent: 0 })).toBe(false);
    expect(hasDiscount({ price: 100, isDiscount: false, discountPercent: 20 })).toBe(false);
  });
});
