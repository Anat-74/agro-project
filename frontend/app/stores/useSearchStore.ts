// Импорт типа Product для типизации товаров
import type { Product } from "~/types/types"

// Store для управления поиском продуктов
export const useSearchStore = defineStore("search", () => {
  // Использование Strapi API для поиска
  const { find } = useStrapi()
  // Текущий маршрут для получения параметров локализации
  const route = useRoute()

  // Реактивный объект фильтров: имя и сортировка
  const filters = reactive({
    name: "",
    sort: "",
  })

  // Массив найденных продуктов
  const products = ref<Product[]>([])
  // Текущая страница пагинации
  const currentPage = ref(1)
  // Общее количество страниц
  const totalPages = ref(1)
  // Статус выполнения поиска: idle, pending, success
  const status = ref<"idle" | "pending" | "success">("idle")
  // Флаг, указывающий, был ли выполнен поиск
  const hasSearched = ref(false)

  // Функция выполнения поиска
  const executeSearch = async () => {
    // Если имя поиска пустое, очищаем результаты и сбрасываем флаг
    if (!filters.name.trim()) {
      products.value = []
      hasSearched.value = false // Сбрасываем флаг поиска
      return;
    }

    // Устанавливаем статус в pending
    status.value = "pending"
    try {
      // Выполняем запрос к Strapi
      const result = await find<Product>("products", getQueryParams());
      // Сохраняем результаты
      products.value = result.data
      // Сохраняем общее число страниц
      totalPages.value = (
        result.meta.pagination as { pageCount: number }
      ).pageCount
      // Устанавливаем флаг выполненного поиска
      hasSearched.value = true
    } finally {
      // Устанавливаем статус в success
      status.value = "success"
    }
  }

  // Функция обновления фильтров
  const updateFilters = (newFilters: { name: string; sort: string }) => {
    // Проверяем, был ли поиск активен до обновления
    const wasSearching = !!filters.name.trim()

    // Обновляем фильтры
    filters.name = newFilters.name
    filters.sort = newFilters.sort
    // Сбрасываем страницу на первую
    currentPage.value = 1

    // Выполняем поиск, если есть имя или был активен поиск
    if (filters.name.trim() || wasSearching) {
      executeSearch()
    }
  }

  // Функция смены страницы
  const changePage = (page: number) => {
    currentPage.value = page
    executeSearch()
  }

  // Функция формирования параметров запроса
  const getQueryParams = () => {
    // Убираем фильтр по productSlug если он есть в URL
    const baseFilters: any = {
      locale: route.params.lang,
    }

    // Используем отформатированный запрос
    if (filters.name.trim()) {
      baseFilters.name = { $containsi: filters.name.trim() }
    }

    // Добавляем фильтр по slug только если мы НЕ на странице товара
    if (!route.params.productSlug) {
      baseFilters.slug = { $eq: route.params.productSlug }
    }

    return {
      populate: {
        subcategory: {
          populate: {
            category: {
              fields: ["slug"] // Выбираем только поле slug из категории
            }
          },
        },
      },
      filters: baseFilters,
      sort: [filters.sort],
      pagination: {
        page: currentPage.value,
        pageSize: 32,
      },
    }
  }

  // Функция сброса фильтров
  const resetFilters = () => {
    filters.name = ""
    filters.sort = ""
    products.value = []
    hasSearched.value = false
    currentPage.value = 1
  }

  return {
    filters,
    products,
    currentPage,
    totalPages,
    status,
    hasSearched,
    executeSearch,
    updateFilters,
    changePage,
    resetFilters,
  }
})
