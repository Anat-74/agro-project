import { defineMcpTool } from "@nuxtjs/mcp-toolkit/server";
import { z } from "zod";

// Предопределенные рецепты
const RECIPES = {
  borscht: {
    name: "Борщ",
    description: "Ингредиенты для классического борща",
    ingredients: [
      { name: "свекла", quantity: 3, unit: "шт" },
      { name: "картофель", quantity: 4, unit: "шт" },
      { name: "капуста", quantity: 0.5, unit: "кг" },
      { name: "морковь", quantity: 2, unit: "шт" },
      { name: "лук", quantity: 2, unit: "шт" },
      { name: "томатная паста", quantity: 2, unit: "ст.л" },
      { name: "мясо (говядина)", quantity: 0.5, unit: "кг" },
      { name: "сметана", quantity: 1, unit: "уп" },
      { name: "укроп", quantity: 1, unit: "пучок" },
    ]
  },
  salad: {
    name: "Овощной салат",
    description: "Ингредиенты для свежего овощного салата",
    ingredients: [
      { name: "помидоры", quantity: 3, unit: "шт" },
      { name: "огурцы", quantity: 2, unit: "шт" },
      { name: "лук", quantity: 1, unit: "шт" },
      { name: "перец", quantity: 1, unit: "шт" },
      { name: "масло оливковое", quantity: 1, unit: "уп" },
      { name: "лимон", quantity: 0.5, unit: "шт" },
    ]
  },
  breakfast: {
    name: "Завтрак",
    description: "Ингредиенты для полноценного завтрака",
    ingredients: [
      { name: "яйца", quantity: 6, unit: "шт" },
      { name: "хлеб", quantity: 1, unit: "буханка" },
      { name: "масло сливочное", quantity: 1, unit: "уп" },
      { name: "сыр", quantity: 0.2, unit: "кг" },
      { name: "колбаса", quantity: 0.3, unit: "кг" },
      { name: "кофе", quantity: 1, unit: "уп" },
      { name: "молоко", quantity: 1, unit: "л" },
    ]
  },
  soup: {
    name: "Куриный суп",
    description: "Ингредиенты для куриного супа",
    ingredients: [
      { name: "курица", quantity: 0.5, unit: "кг" },
      { name: "картофель", quantity: 3, unit: "шт" },
      { name: "морковь", quantity: 2, unit: "шт" },
      { name: "лук", quantity: 1, unit: "шт" },
      { name: "вермишель", quantity: 0.2, unit: "кг" },
      { name: "зелень", quantity: 1, unit: "пучок" },
    ]
  },
  pizza: {
    name: "Домашняя пицца",
    description: "Ингредиенты для домашней пиццы",
    ingredients: [
      { name: "мука", quantity: 0.5, unit: "кг" },
      { name: "дрожжи", quantity: 1, unit: "уп" },
      { name: "томатный соус", quantity: 1, unit: "банка" },
      { name: "сыр моцарелла", quantity: 0.3, unit: "кг" },
      { name: "колбаса", quantity: 0.2, unit: "кг" },
      { name: "грибы", quantity: 0.2, unit: "кг" },
      { name: "перец", quantity: 1, unit: "шт" },
    ]
  },
  smoothie: {
    name: "Фруктовый смузи",
    description: "Ингредиенты для витаминного смузи",
    ingredients: [
      { name: "банан", quantity: 2, unit: "шт" },
      { name: "яблоки", quantity: 2, unit: "шт" },
      { name: "апельсин", quantity: 1, unit: "шт" },
      { name: "йогурт", quantity: 1, unit: "уп" },
      { name: "мед", quantity: 1, unit: "ст.л" },
    ]
  },
  barbecue: {
    name: "Шашлык",
    description: "Ингредиенты для шашлыка на природе",
    ingredients: [
      { name: "свинина", quantity: 1, unit: "кг" },
      { name: "лук", quantity: 3, unit: "шт" },
      { name: "лимон", quantity: 1, unit: "шт" },
      { name: "специи", quantity: 1, unit: "уп" },
      { name: "угли", quantity: 1, unit: "уп" },
      { name: "овощи для гриля", quantity: 1, unit: "набор" },
    ]
  }
};

const inputSchema = z.object({
  recipe: z.enum(["borscht", "salad", "breakfast", "soup", "pizza", "smoothie", "barbecue"]).optional(),
  customIngredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(0.1),
    unit: z.string(),
  })).optional(),
  clearCart: z.boolean().default(true),
});

type Input = z.infer<typeof inputSchema>;

export default defineMcpTool({
  description: "Create shopping cart based on a recipe or meal plan",
  inputSchema: inputSchema.shape,
  handler: async ({ recipe, customIngredients, clearCart }: Input) => {
    let ingredients = [];
    
    if (recipe && RECIPES[recipe]) {
      ingredients = RECIPES[recipe].ingredients;
    } else if (customIngredients && customIngredients.length > 0) {
      ingredients = customIngredients;
    } else {
      return { 
        success: false, 
        error: "No recipe or ingredients specified" 
      };
    }
    
    const recipeName = recipe ? RECIPES[recipe].name : "Custom recipe";
    
    return {
      success: true,
      instruction: {
        type: 'create_recipe_cart',
        data: {
          recipe,
          customIngredients,
          clearCart,
          recipeName,
          ingredients
        }
      },
      message: `Инструкция для создания корзины "${recipeName}" создана`,
      recipe: recipeName,
      ingredientCount: ingredients.length,
    };
  },
});