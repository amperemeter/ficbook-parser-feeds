# Ficbook Feeds Parser

Парсер для сайта [ficbook.net](https://ficbook.net), отслеживающий появление новых фанфиков в выбранных фандомах и
пэйрингах. 

Представлено два вида парсеров:
1) С использованием базы данных в облачном хранилище.
2) С использованием хранящегося локально файла.

Чтобы парсер (с использованием базы данных) заработал, нужно:

#### Создать проект

1. Создать на компьютере папку с любым названием.
2. Создать в корне папки файл `index.js`.
3. Инициализировать проект nodejs, введя в терминале (cmd в Windows) команду `[npm init]`. Вы
   должны находиться в корне проекта.
4. Установить пакет с парсером, введя команду `[npm install ficbook-feeds-parser]`.
5. Подключить пакет в файле `index.js`: `const app = require("ficbook-feeds-parser");`

#### Создать базу данных

4. Зарегистрироваться на сайте [cloud.mongodb.com](https://cloud.mongodb.com/) и создать новый кластер (на данный момент, чтобы зайти на сайт, требуется VPN).
5. Создать в кластере базу данных с названием `fanficsdb`, а внутри нее коллекцию с названием `fanfics`.
6. Создать юзера со всеми правами.
7. Создать в `fanfics` объекты c названием нужного вам фэндома или пэринга, ссылкой на него и количеством фанфиков в
   значении 0.

* Выглядеть должно
  так: `{ "_id": {"$oid": "5fbd52194c8f4b6314d6b5e1"}, "name": "Гарри Поттер", "url": "https://ficbook.net/fanfiction/books/harri_potter", "count": 0 }`.
  ID создается автоматически.
* В ссылке на пэйринг необходимо закодировать кириллицу в кодировке UTF-8 . Пример
  ссылки: `https://ficbook.net/pairings/%D0%9D%D1%83%D0%B0%D0%B4%D0%B0---%D0%9D%D1%83%D0%B0%D0%BB%D0%B0`).

#### Подключить базу данных

8. Добавить в файле `index.js` строку `app("mongodb+srv://<username>:<password>@<clustername>.xmsaf.mongodb.net/?retryWrites=true&w=majority&appName=<Clustername>")`
9. В этой же строке необходимо поменять значения `[username]`, `[password]`, `[clustername]` на ваши значения.

#### Запустить парсер

10. Запустить парсер в терминале стандартной командой `[node index]` или `[node .]`. Первый запуск парсера добавит количество фанфиков
    в базу данных. Последующие запуски отобразят количество новых фанфиков при их наличии.

## Хранение данных локально

При желании вы можете хранить данные не в базе данных, а локально в файле `fanfics.json`. Для этого воспользуйтесь [следующей инструкцией](local/README.md).

## ВАЖНО!

При запуске парсера желательно хотя бы некоторое время проследить за ходом выполнения парсинга. Если вам кажется, что во время парсинга что-то пошло не так, нажмите `[CTRL+C]` для завершения процесса.
