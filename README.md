# Plugin Manager (r7c)

## История

Основано на коде [ONLYOFFICE Plugin Manager](https://github.com/ONLYOFFICE/onlyoffice.github.io). Исходный код лицензирован под Apache License 2.0. Все последующие модификации распространяются под лицензией DataCons Plugin Manager License (см. `LICENSE`).

## Структура репозитория

```
r7c/
 ├─ LICENSE.md
 ├─ README.md
 ├─ config.json
 ├─ developer.html
 ├─ index.html
 ├─ welcome.md
 ├─ store/
 │   ├─ scripts/
 │   ├─ resources/
 │   ├─ translations/
 │   └─ ... (плагины и storefront)
 ├─ resources/
 ├─ scripts/
 ├─ translations/
 ├─ vendor/
 └─ warning.html
```

Ключевые моменты:

1. Файлы `LICENSE.md`, `NOTICE` и `3rd-Party.txt` обеспечивают соблюдение требований Apache 2.0 и фиксируют происхождение кода.
2. Папка `store/` содержит интерфейс Plugin Manager (HTML/JS/CSS + контент), верхний уровень — служебные конфиги и оболочка.
3. Такая структура повторяет фактическую организацию проекта и применяется на практике в крупных гибридных (open+closed) решениях.
4. Проприетарные доработки описаны в `LICENSE.md`, поэтому новая логика может распространяться под закрытой лицензией, не нарушая условий Apache 2.0 для исходных компонентов.

## Дополнительная информация

- Основная лицензия: см. `LICENSE`.
- Уведомления о происхождении кода и сторонних компонентах: `NOTICE`, `THIRD_PARTY_LICENSES`.