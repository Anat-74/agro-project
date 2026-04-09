// Тестовый скрипт для проверки функции поиска
const { searchProducts } = require('./server/utils/product-search.ts');

async function testSearch() {
  console.log('Тестирование поиска товаров...');
  
  // Тест 1: Поиск "яблоки" (должен найти "Яблоко Каштель")
  console.log('\nТест 1: Поиск "яблоки"');
  const result1 = await searchProducts('яблоки', undefined, 5);
  console.log('Результат:', JSON.stringify(result1, null, 2));
  
  // Тест 2: Поиск "Яблоко" (должен найти "Яблоко Каштель")
  console.log('\nТест 2: Поиск "Яблоко"');
  const result2 = await searchProducts('Яблоко', undefined, 5);
  console.log('Результат:', JSON.stringify(result2, null, 2));
  
  // Тест 3: Поиск "овощи" (должен найти овощи)
  console.log('\nТест 3: Поиск "овощи"');
  const result3 = await searchProducts('овощи', undefined, 5);
  console.log('Результат:', JSON.stringify(result3, null, 2));
  
  // Тест 4: Поиск без запроса (должен вернуть все товары)
  console.log('\nТест 4: Поиск без запроса');
  const result4 = await searchProducts(undefined, undefined, 5);
  console.log('Результат:', JSON.stringify(result4, null, 2));
}

testSearch().catch(console.error);