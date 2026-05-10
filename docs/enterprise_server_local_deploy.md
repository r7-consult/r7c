# Enterprise Server: локальная проверка статического каталога

Этот документ описывает текущий POC, где `{r7} consult` берет каталог и файлы
плагинов не с GitHub, а с небольшого локального HTTP-сервера.

## Что проверяем

- `r7c-packages` раздается как статический каталог по `http://127.0.0.1:8090/`.
- `{r7} consult` загружает:
  - `store/config.json`;
  - `sdkjs-plugins/content/<plugin>/config.json`;
  - иконки, README, LICENSE и остальные ресурсы плагинов.
- GitHub не нужен для получения каталога и установки плагинов.

## Поднять локальный сервер каталога

В отдельном PowerShell-окне:

```powershell
cd C:\Users\Даниил\Desktop\plugins\r7c-packages
powershell -ExecutionPolicy Bypass -File .\enterprise\serve-static-catalog.ps1 -Port 8090
```

Проверка:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8090/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8090/store/config.json
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8090/sdkjs-plugins/content/hello-world/config.json
```

В окне сервера должны появляться строки:

```text
GET /health
GET /store/config.json
GET /sdkjs-plugins/content/hello-world/config.json
```

## Проверка в R7 Desktop

1. Установить билд:

```text
C:\Users\Даниил\Desktop\plugins\r7c\build\r7c_enterprise_server_v1.1.4_local.plugin
```

2. Запустить R7 Desktop и открыть `{r7} consult`.
3. Открыть каталог и установить небольшой плагин, например `Hello World`.
4. Смотреть окно локального сервера `8090`. При загрузке каталога и установке
   должны появляться запросы к:

```text
/store/config.json
/sdkjs-plugins/content/<plugin>/config.json
/sdkjs-plugins/content/<plugin>/resources/...
/sdkjs-plugins/content/<plugin>/index.html
```

Это прямое доказательство, что данные идут с локального сервера.

## Проверка Welcome / README / Support / License

В текущем локальном билде:

```js
managerUpdateBaseUrl: 'http://127.0.0.1:8089/'
```

Если дополнительно поднят Python-сервер из папки `r7c`, страницы самого
менеджера будут запрашиваться у него:

```powershell
cd C:\Users\Даниил\Desktop\plugins\r7c
python -m http.server 8089 --bind 127.0.0.1
```

В окне Python-сервера при открытии вкладок должны появиться:

```text
GET /welcome.md
GET /README.md
GET /support.md
GET /LICENSE.md
```

Если сервер `8089` выключен, менеджер использует fallback-тексты, встроенные в
сам `.plugin`. Это тоже не GitHub.

## Как убедиться, что GitHub не используется

Самый надежный тест:

1. Оставить сервер `8090` включенным.
2. Временно заблокировать GitHub/raw через `hosts`.
3. Перезапустить R7 Desktop.
4. Открыть `{r7} consult`.

Открыть PowerShell от администратора:

```powershell
Start-Process powershell -Verb RunAs
```

В новом окне:

```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Добавить:

```text
0.0.0.0 raw.githubusercontent.com
0.0.0.0 github.com
0.0.0.0 api.github.com
```

Очистить DNS-кеш:

```powershell
ipconfig /flushdns
```

Проверить, что GitHub закрыт:

```powershell
curl.exe -I https://raw.githubusercontent.com/r7-consult/r7c-packages/main/store/config.json
```

После этого каталог должен продолжать работать через `http://127.0.0.1:8090/`.

## Вернуть доступ к GitHub

Снова открыть `hosts` от администратора, удалить добавленные строки и выполнить:

```powershell
ipconfig /flushdns
```

## Что остается на следующий этап

- Развернуть такой же статический сервер на внутреннем домене.
- Добавить sync-service, который будет обновлять локальную копию из GitHub или
  GitVerse.
- Локализовать внешние SDK-ресурсы `onlyoffice.github.io`, если потребуется
  полностью автономная enterprise-сборка без любого внешнего интернета.
