// Синонимы товаров: народное название → название в Strapi
// Добавляй сюда пары, если ассистент не находит товар по запросу пользователя
const synonymMap: Record<string, string> = {
  "картошка": "картофель",
  "картошечка": "картофель",
  "помидор": "томат",
  "помидорчик": "томат",
  "свёкла": "свекла",
  "кабачок": "цукини",
  "грушка": "груша",
  "вишенка": "вишня",
  "сливки": "слива",
  "орешки": "орех",
  "фундучок": "фундук",
};

// Проверяет, есть ли синоним для query, возвращает каноническое название
export function getSynonym(query: string): string | null {
  const lower = query.toLowerCase().trim();
  return synonymMap[lower] || null;
}

// Заменяет все синонимы в строке запроса
export function replaceSynonyms(query: string): string {
  let result = query.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(synonymMap)) {
    if (result.includes(alias)) {
      result = result.replace(alias, canonical);
    }
  }
  return result;
}
