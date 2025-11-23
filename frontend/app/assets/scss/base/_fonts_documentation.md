# Документация по подключению шрифтов

## Описание

В проекте используются следующие шрифтовые семейства:

1. **Montserrat** - основной шрифт для интерфейса
2. **RubikBurned** - декоративный шрифт
3. **Yellowtail** - шрифт для заголовков (например, "Categories")
4. **Roboto** - шрифт для заголовков (например, "Our Products")
5. **Open Sans** - шрифт для основного контента (названия продуктов, цены, теги)

## Подключение шрифтов

Шрифты подключаются через @font-face правила в файле [_fonts.scss](./_fonts.scss).

### Использование в CSS

В файле [_globals.scss](./_globals.scss) определены переменные для шрифтов:

- `$font-family: "Montserrat"` - основной шрифт
- `$font-family2: "RubikBurned"` - второй шрифт
- `$font-family-article: "Yellowtail"` - шрифт для статей
- `$font-family-headings: "Roboto"` - шрифт для заголовков
- `$font-family-content: "Open Sans"` - шрифт для контента

## Использование в Figma

Согласно анализу макета Figma:

- Для заголовка "Categories" - шрифт "Yellowtail" (Regular)
- Для заголовка "Our Products" - шрифт "Roboto" (ExtraBold)
- Для названий продуктов - шрифт "Roboto" (SemiBold)
- Для отображения цен - шрифт "Open Sans" (Bold и SemiBold)
- Для тегов (Vegetable, Fresh, Millets, и т.д.) - шрифт "Open Sans" (SemiBold)

## Локальные файлы шрифтов

Все шрифты хранятся в папке `frontend/public/fonts/` в формате WOFF2.

## Добавление новых шрифтов

Для добавления новых шрифтов:

1. Скачайте файлы шрифтов и поместите их в папку `frontend/public/fonts/`
2. Преобразуйте шрифты в формат WOFF2 с помощью инструментов оптимизации
3. Добавьте @font-face правило в файл [_fonts.scss](./_fonts.scss), используя формат WOFF2
4. При необходимости добавьте переменную в файл [_globals.scss](./_globals.scss)
5. Обновите эту документацию