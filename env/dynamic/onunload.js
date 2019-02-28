// todo - проверить возможность перехвата события beforeunload без инъекции в основное окно (window.onbeforeunload - при присвоении через расширение не срабатывает)
// Используется только для предотвращения случайных закрытий окна при выполнении длительных процессов, функция будет заменена на более универсальное решение в будущем

if (typeof KELLY_ONUNLOAD == 'undefined') {
    
    function KELLY_ONUNLOAD(e) {

        e.preventDefault();
        e.returnValue = '';
    }
    
    window.addEventListener('beforeunload', KELLY_ONUNLOAD);	
    
} else {
    
    window.removeEventListener('beforeunload', KELLY_ONUNLOAD);	
}
