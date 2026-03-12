# Гайд по добавлению плагина в `{r7c}.packages`

Этот документ описывает полный цикл добавления нового плагина в репозиторий [`r7c-packages`](https://github.com/r7-consult/r7c-packages). В нём учтены особенности обычных (open-source) и коммерческих плагинов, а также то, как плагин отображается в интерфейсе {r7} Plugin Manager.

## 0. Базовые пути и файлы

| Что | Путь/файл |
| --- | --- |
| Каталог с плагинами | `sdkjs-plugins/content/<plugin-name>/` |
| Регистрация в магазине | `store/config.json` (массив плагинов) |
| Пример коммерческого плагина | `sdkjs-plugins/content/slider-query/config.json` |
| Пример обычного плагина | `sdkjs-plugins/content/r7c-code/config.json`, `sdkjs-plugins/content/drawio/config.json` |

> **Важно:** поле `name` из `store/config.json` должно совпадать с именем папки в `sdkjs-plugins/content/`.

## 1. Быстрый чеклист

1. Создать папку `sdkjs-plugins/content/<plugin-name>/`.
2. Добавить `config.json` с описанием плагина.
3. Положить UI-файл (`index.html`) и необходимые скрипты/стили.
4. Скопировать иконки и скриншоты в пути, указанные в `config.json`.
5. Добавить `README.md` (будет доступен по ссылке «Learn how to use»).
6. Добавить `CHANGELOG.md` (подтягивается во вкладку «Changelog»).
7. При необходимости добавить LICENSE (для репозитория, в UI ПМ отдельной вкладки нет).
8. Прописать плагин в `store/config.json`.
9. Собрать и протестировать в {r7} Plugin Manager (установка/линк, категории, отображение).

## 2. Поля `config.json`

```json
{
  "name": "My Plugin",
  "offered": "ООО \"Датаконс\"",
  "guid": "asc.{GUID}",
  "version": "1.0.0",
  "variations": [
    {
      "description": "Что делает плагин",
      "descriptionLocale": { "ru": "...") },
      "url": "index.html",
      "icons": ["resources/light/icon.png", "resources/light/icon@2x.png"],
      "isViewer": true,
      "EditorsSupport": ["word", "cell", "slide"],
      "isVisual": true,
      "isModal": true,
      "isInsideMode": false,
      "initDataType": "none",
      "buttons": [],
      "store": {
        "background": { "light": "#F5F5F5", "dark": "#444444" },
        "screenshots": ["resources/store/screenshots/screen_1.png"],
        "icons": {
          "light": "resources/store/icons",
          "dark": "resources/store/icons"
        },
        "categories": ["work", "specAbilities"]
      }
    }
  ]
}
```

### 2.1 Автор ("Offered by")
- Указываем на верхнем уровне: `"offered": "Название организации"`.
- В UI отображается в блоке **Offered by** (см. `store/index.html`, строки 85-87).

### 2.2 Категории
- Хранятся в `variations[0].store.categories`.
- Доступный список допустимых значений (фильтр UI):
- `recommended`
- `commercial`
- `devTools`
- `work`
- `entertainment`
- `communication`
- `specAbilities`

См. @r7c-packages/store/index.html#54-62. Используйте только эти значения, иначе фильтр работать не будет.

### Полный список категорий

| Категория      | Назначение                                                       |
| -------------- | ---------------------------------------------------------------- |
| `recommended`  | Попадает в подборку «Recommended» вверху каталога                |
| `commercial`   | Коммерческие плагины с внешним лендингом                         |
| `devTools`     | Инструменты разработки и интеграции                              |
| `work`         | Рабочие/офисные сценарии                                         |
| `entertainment`| Развлекательные плагины                                          |
| `communication`| Инструменты коммуникаций                                         |
| `specAbilities`| Специальные возможности, accessibility, нишевые кейсы            |

### 2.3 Скриншоты и иконки
- `store.screenshots` — массив путей. Показываются в галерее Overview.
- `store.icons` — папки с вариантами для светлой/тёмной темы. Если не указаны, магазин использует `icons`/`icons2`.
- Иконки должны иметь варианты под масштабы (`icon@1.25x.png`, `icon@2x.png` и т.д.) для корректного отображения.

### 2.4 Background
- `store.background.light/dark` задаёт цвет подложки карточки.

### 2.5 README и CHANGELOG
- `README.md` должен лежать в корне плагина — ссылка формируется автоматически.
- `CHANGELOG.md` будет подгружен и показан во вкладке Changelog, если файл существует.
- `LICENSE` (или `LICENSE.md`) храните в корне плагина: он нужен для репозитория и отображается наравне с changelog в Info & Support.

## 3. Обычный vs коммерческий плагин

### 3.1 Открытый плагин
- Полное описание структуры смотрите на примере `r7c-code` или `drawio`.
- Кнопка **Install/Update/Remove** работает стандартно.

### 3.2 Коммерческий плагин с внешней ссылкой
- Пример: `slider-query`.
- Внутри `store` добавляется блок `commercial`:

```json
"store": {
  "categories": ["commercial"],
  "commercial": {
    "external": true,
    "landingUrl": "https://your-landing.example.com/"
  },
  "background": {
    "light": "#f3f6fb",
    "dark": "#2a2f3a"
  }
}
```

- В UI кнопка Install заменяется на переход по `landingUrl` (см. `store/scripts/code.js`, строки 1195-1203).

## 4. Регистрация в `store/config.json`

```json
[
  { "name": "cell-statistics", "discussion": "" },
  { "name": "my-plugin", "discussion": "" }
]
```

- `discussion` можно оставить пустым либо указать slug для раздела обсуждения.

## 5. Как UI использует файлы и поля

| Элемент UI | Откуда берётся |
| --- | --- |
| Название/описание | `variations[0].description` + локализации |
| Offered by | `offered` |
| Скриншоты | `store.screenshots` |
| Иконка | `store.icons` (или `icons`/`icons2`) |
| README | `<pluginBase>/README.md` |
| Changelog | `<pluginBase>/CHANGELOG.md` |
| License | `<pluginBase>/LICENSE` или `LICENSE.md` (показывается рядом с README) |
| Версия, минимальная версия | `version`, `minVersion` |
| Категории/фильтры | `store.categories` |
| Кнопка Install | стандартная или `landingUrl` при commercial |

## 6. Подробный сценарий «с нуля»

1. **Добавте плагин - примерная структура плагина**
   ```
   sdkjs-plugins/content/my-plugin/
   ├── config.json
   ├── index.html
   ├── README.md
   ├── CHANGELOG.md
   ├── LICENSE.md
   └── resources/
       ├── light/
       ├── dark/
       └── store/
           ├── icons/
           └── screenshots/
   ```
2. **Заполнить config.json** (open/commercial вариант).
3. **Добавить плагин в store/config.json**.
4. **Проверить UI магазина**:
   - карточка появляется в нужной категории;
   - «Offered by» отображает автора;
   - скриншоты прокручиваются;
   - README/Changelog/License открываются;
   - кнопка Install работает как нужно (внешняя ссылка для commercial).

## 7. Частые ошибки

1. `name` в `store/config.json` не совпадает с именем папки.
2. Неверные относительные пути к иконкам/скриншотам.
3. Категории вне списка, используемого фильтром UI.
4. Для коммерческого плагина забыты `external: true` или `landingUrl`.
5. Отсутствует `CHANGELOG.md` — вкладка Changelog будет пустой.

---

При необходимости можно создать шаблонные папки (open/commercial) и запушить в `sdkjs-plugins/content/`, чтобы новые плагины добавлялись быстрее. Если потребуется автоматизация/скрипт, дайте знать — подготовлю.
