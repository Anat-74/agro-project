// Тестовый скрипт для прямой проверки функции поиска
const { $fetch } = require('ofetch');

async function testSearch() {
  console.log('Тестирование поиска напрямую через Strapi API...\n');
  
  const strapiUrl = "http://127.0.0.1:1337";
  
  // Тест 1: Поиск по "Яблоко" (должен найти "Яблоко Каштель")
  console.log('Тест 1: Поиск по "Яблоко" с фильтром $startsWith');
  try {
    const response1 = await $fetch(`${strapiUrl}/api/products`, {
      params: {
        "pagination[pageSize]": 5,
        "pagination[page]": 1,
        "populate": "*",
        "sort": "name:asc",
        "filters[name][$startsWith]": "Яблоко"
      }
    });
    console.log('Найдено товаров:', response1.data ? response1.data.length : 0);
    if (response1.data && response1.data.length > 0) {
      console.log('Товары:', response1.data.map(p => `${p.name} (${p.price} руб)`));
    }
    console.log('');
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
  
  // Тест 2: Поиск по "Яблоки" (не должен найти)
  console.log('Тест 2: Поиск по "Яблоки" с фильтром $startsWith');
  try {
    const response2 = await $fetch(`${strapiUrl}/api/products`, {
      params: {
        "pagination[pageSize]": 5,
        "pagination[page]": 1,
        "populate": "*",
        "sort": "name:asc",
        "filters[name][$startsWith]": "Яблоки"
      }
    });
    console.log('Найдено товаров:', response2.data ? response2.data.length : 0);
    if (response2.data && response2.data.length > 0) {
      console.log('Товары:', response2.data.map(p => `${p.name} (${p.price} руб)`));
    }
    console.log('');
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
  
  // Тест 3: Получить все товары
  console.log('Тест 3: Все товары (без фильтра)');
  try {
    const response3 = await $fetch(`${strapiUrl}/api/products`, {
      params: {
        "pagination[pageSize]": 10,
        "pagination[page]": 1,
        "populate": "*",
        "sort": "name:asc"
      }
    });
    console.log('Всего товаров:', response3.meta && response3.meta.pagination ? response3.meta.pagination.total : 0);
    console.log('Товары:', response3.data ? response3.data.map(p => p.name) : []);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

testSearch().catch(console.error);