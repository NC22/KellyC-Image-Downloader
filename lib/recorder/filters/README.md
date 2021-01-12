# Фильтры данных для разных сайтов

В папке <b>\lib\recorder\filters</b> хранятся пользовательские фильтры расширяющие возможности модуля записи

Файл <b>_validators.js</b> фильтры которые не требуют дополнительной логики и ассоциируют изображения через совпадения в строке ссылки.
Остальные файлы - расширенные классы фильтрации под определенные сайты

Пример структуры файла класса фильтра с расширенной логикой. Практические рабочие примеры см. так же в папке. 

использовать шаблон названия - KellyRecorderFilter[Название_класса]

```
 KellyRecorderFilterExample = new Object(); 
```

[Название_класса].manifest - массив с параметрами описания, используется для статистики и проверки совместимости фильтра с использованием функции "Загрузить доп. документы"
 
* host - массив строк или строка - список хостов, актуальных для фильтра
* detectionLvl - возможности фильтрации 'imageAny' - общаяя группа для превью и оригиналов, 'imagePreview' - превью, 'imageOriginal' - оригинал, 'imageByDocument' - оригинал > взятый из документа превью


```
 KellyRecorderFilterExample.manifest = {host : 'example.com', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal', 'imageByDocument']}; 
```

Метод __addItemByDriver__ вызывается перед обработкой DOM элемента el страницы методом поумолчанию (kellyPageWatchDog.parseItem). 

Метод (_kellyPageWatchDog.parseItem_) если фильтр не завершает \ заменяет его выполнение, в общем случае собирает ссылки определенные как _возможные картинки_ из элемента el в объект item (структура объекта описана в kellyPageWatchDog) и пробует найти ассоциируемую с картинкой ссылку на документ (например <a href="документ содержащий оригинал"><img src="превью"></a>) и добавляет итоговый объект в общий список.
    
Метод _addItemByDriver_ может вернуть одно из следующих значений
    
* handler.addDriverAction.SKIP - пропустить DOM элемент и не включать item в общий массив данных по картинкам
* handler.addDriverAction.CONTINUE - продолжить обработку методом (kellyPageWatchDog.parseItem) = отсутствию возвращаемого значения
* handler.addDriverAction.ADD - добавить item и продолжить проход по списку элементов DOM
    
_предполагаемая ссылка на изображение_ определяется исходя из нескольких условий - уровня доверия конкретному тегу (IMG | SOURCE | DIV) в зависимости от его названия \ атрибуту тега \ возможности предположить расширение файлы исходя из строки ссылки. Это позволяет отсеивать строки которые точно не могут являтся ссылками (общий метод валидации см. kellyPageWatchDog.addSingleSrc)

```

KellyRecorderFilterExample.addItemByDriver = function(handler, el, item) {
      
     // проверяем нужный ли url (соответствует активному табу или хосту relatedDoc) страницы и подходит ли DOM элемент нашим условиям
     if (handler.url.indexOf('example.com') != -1 && (el.classList.contains('photo') || el.classList.contains('thumb'))) {
        
        // обрабатываем элемент доступными методами и заполняем item элементами relatedSrc - ссылками на картинки
        // есть несколько реализованых методов для этого
        
        // handler.addSrcFromAttributes = function(el, item, excludeAttributes = ['name', 'class', 'style', 'id', 'type', 'alt', 'title']) - просканировать все атрибуты элемента и добавить все "предполагаемые ссылки на изображения" в item.relatedSrc * 
        
        return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;    
     }
}

```

Метод __parseImagesDocByDriver__ вызывается при загрузке дочернего документа (item.relatedDoc). Переменная _thread_ содержит результат выполнения запроса к документу

Запрос к дочернему документу (поумолчанию - method : 'GET', responseType : 'text') опционально конфигурируется через доп. переменные в строке запроса после разделителя ##FETCH_RULES## на этапе заполнения массива картинок методом __addItemByDriver__

Например :

```
item.relatedDoc = http://example.com/original-image-page?get=1&get2=234##FETCH_RULES##method=POST&responseType=json&contentType=application/x-www-form-urlencoded&xRequestedWith=XMLHttpRequest&mark_comment=1
```

Выполнит POST запрос с параметрами GET - {get : 1, get2 : 234}, responseType = json. Заголовки {contentType : application/x-www-form-urlencoded, x-requested-with : XMLHttpRequest}

параметр mark_comment = 1 и другие с префиксом mark_ в запросе не учавствуют и используются при необходимости только для постобработки (все параметры сохраняются в thread.rules - массив вида ['mark_comments=1', 'responseType=json', ...])

Установка POST данных пока не поддерживается.
Установка доп. заголовков пока не поддерживается.

* thread.response - тело ответа | документ | медиа данные | json - в зависимости запроса  от thread.request.contentType

```

KellyRecorderFilterExample.parseImagesDocByDriver = function(handler, thread) {
    
        if (handler.url.indexOf('vk.com') != -1 && typeof thread.response == 'object' && handler.url.indexOf('original-image-page') != -1) {
                if (thread.response.originalImage) {
                    handler.imagesPool.push({relatedSrc : [thread.response.originalImage]}); // заполняем полученными данными, важна только ссылка на оригинал
                    return true; // прерываем обработку поумолчанию
                }
        }    
}

```

Метод __onInitDocLoader__ в процессе доработки / могут быть изменения, не рекомендуется к использованию
Выполняется перед запуском загрузчика дополнительных документов
Позволяет конфигурировать загрузчик перед запуском. Если вернуть false - остановит запуск

```

KellyRecorderFilterExample.onInitDocLoader = function(docLoader, hostList) {}

KellyRecorderFilterExample.onInitLocation = function(handler, data) {}

```

Можно менять конфигурацию загрузчика _docLoader_ через метод __docLoader.parser.updateCfg__

```

docLoader.parser.updateCfg(threadDefaults = {   
    pauseEvery : '50',
    pauseTimer : '1.2,1.8,2,2.4,2.8',
    timeout : '5',
    timeoutOnEnd : '0.8',
    maxThreads : '1',
})

```

Метод onInitLocation в процессе доработки / могут быть изменения, не рекомендуется к использованию
Выполняется после инициализации парсера страницы - data.url - адресная строка вкладки / data.host - аналог window.location.hostname
Позволяет конфигурировать парсер перед запуском

Пока использовать нет необходимости т.к. параметров для изменения нет.

```

KellyRecorderFilterExample.onInitLocation = function(handler, data) {}

```

Метод onInitOptions в процессе доработки / могут быть изменения, не рекомендуется к использованию
Инициализация настроек для вкладки "Настройки"

Пока не используется сущ. фильтрами. описание будет позже

```

KellyRecorderFilterExample.onInitOptions = function(options, coptions) {}

```

Запуск фильтр и доп. валидаторы через общий список

```
KellyPageWatchdog.validators.push({url : 'deviantart', patterns : [['images-wixmp', 'imageAny']]}); // опционально фильтр по соответствию строки (аналогичны файлу _validators.js)

KellyPageWatchdog.filters.push(KellyRecorderFilterExample); // активируем фильтр, чтобы все методы выполнялись

```