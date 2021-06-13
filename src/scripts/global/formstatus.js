const FormStatus = (function () {
    var selectors = {
        statusMessage: '[data-form-status]'
    };

    function init() {
        var statusMessages = document.querySelectorAll(selectors.statusMessage);

        statusMessages.forEach(function (statusMessage) {
            statusMessage.setAttribute('tabindex', -1);
            statusMessage.focus();

            statusMessage.addEventListener(
                'blur',
                function (evt) {
                    evt.target.removeAttribute('tabindex');
                },
                {once: true}
            );
        });
    }

    return {
        init: init
    };
})();

export default FormStatus;