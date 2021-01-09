В папке [\lib\recorder\filters] хранятся пользовательские фильтры расширяющие возможности модуля записи

Файл _validators.js - фильтры которые не требуют дополнительной логики и ассоциируют изображения через совпадения в строке ссылки.
Остальные файлы - расширенные классы фильтрации под определенные сайты

Пример класса фильтра с расширенной логикой. Практические рабочие примеры см. так же в папке. 

/* использовать шаблон названия - KellyRecorderFilter[Название_класса] */

KellyRecorderFilterExample = new Object(); 

/*
    manifest - описание, используется для статистики и проверки совместимости фильтра с использованием функции "Загрузить доп. документы"
    
    host - массив строк или строка - список хостов, актуальных для фильтра
    detectionLvl - возможности фильтрации 'imageAny' - общаяя группа для превью и оригиналов, 'imagePreview' - превью, 'imageOriginal' - оригинал, 'imageByDocument' - оригинал взятый из документа превью
*/

KellyRecorderFilterExample.manifest = {host : 'example.com', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal', 'imageByDocument']}; 

/*
    Метод addItemByDriver вызывается перед обработкой DOM элемента el страницы методом поумолчанию (kellyPageWatchDog.parseItem). 
    Метод (kellyPageWatchDog.parseItem) если фильтр не завершает \ заменяет его выполнение, в общем случае собирает ссылки определенные как возможные картинки из элемента el в объект item (структура объекта описана в kellyPageWatchDog) и пробует найти ассоциируемую с картинкой ссылку на документ (например <a href="документ содержащий оригинал"><img src="превью"></a>) и добавляет итоговый объект в общий список.
    
    Метод addItemByDriver может вернуть одно из следующих значений
    
    handler.addDriverAction.SKIP - пропустить DOM элемент и не включать item в общий массив данных по картинкам
    handler.addDriverAction.CONTINUE - продолжить обработку методом (kellyPageWatchDog.parseItem) = отсутствию возвращаемого значения
    handler.addDriverAction.ADD - добавить item и продолжить проход по списку элементов DOM
    
    * "предполагаемая ссылка на изображение" определяются исходя из нескольких условий - уровня доверия конкретному тегу (IMG | SOURCE | DIV) в зависимости от его названия \ атрибуту тега \ возможности предположить расширение файлы исходя из строки ссылки. Это позволяет отсеивать строки которые точно не могут являтся ссылками (общий метод валидации см. kellyPageWatchDog.addSingleSrc)
*/

KellyRecorderFilterExample.addItemByDriver = function(handler, el, item) {
      
     // проверяем нужный ли url (соответствует активному табу или хосту relatedDoc) страницы и подходит ли DOM элемент нашим условиям
     if (handler.url.indexOf('example.com') != -1 && (el.classList.contains('photo') || el.classList.contains('thumb'))) {
        
        // обрабатываем элемент доступными методами и заполняем item элементами relatedSrc - ссылками на картинки
        // есть несколько реализованых методов для этого
        
        // handler.addSrcFromAttributes = function(el, item, excludeAttributes = ['name', 'class', 'style', 'id', 'type', 'alt', 'title']) - просканировать все атрибуты элемента и добавить все "предполагаемые ссылки на изображения" в item.relatedSrc * 
        
        return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;    
     }
}

KellyRecorderFilterExample.parseImagesDocByDriver = function(handler, thread) {
    
}

/* 

    Метод onInitLocation в процессе доработки / могут быть изменения, не рекомендуется к использованию
    Выполняется после инициализации парсера страницы - data.url - адресная строка вкладки / data.host - аналог window.location.origin
    Позволяет конфигурировать парсер перед запуском
    
    Пока использовать нет необходимости т.к. параметров для изменения нет.
*/

KellyRecorderFilterExample.onInitLocation = function(handler, data) {}

/* 

    Метод onInitOptions в процессе доработки / могут быть изменения, не рекомендуется к использованию
    Инициализация настроек для вкладки "Настройки"
    
    Пока не используется сущ. фильтрами. описание будет позже
*/

KellyRecorderFilterExample.onInitOptions = function(options, coptions) {}


KellyPageWatchdog.validators.push({url : 'deviantart', patterns : [['images-wixmp', 'imageAny']]}); // опционально фильтр по соответствию строки (аналогичны файлу _validators.js)
KellyPageWatchdog.filters.push(KellyRecorderFilterExample);