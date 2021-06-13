const Helpers = (function() {
    var touchDevice = false;

    var classes = {
        preventScrolling: 'prevent-scrolling'
    };

    var scrollPosition = window.pageYOffset;

    function setTouch() {
        touchDevice = true;
    }

    function isTouch() {
        return touchDevice;
    }

    function enableScrollLock() {
        scrollPosition = window.pageYOffset;
        document.body.style.top = '-' + scrollPosition + 'px';
        document.body.classList.add(classes.preventScrolling);
    }

    function disableScrollLock() {
        document.body.classList.remove(classes.preventScrolling);
        document.body.style.removeProperty('top');
        window.scrollTo(0, scrollPosition);
    }

    function debounce(func, wait, immediate) {
        var timeout;

        return function() {
            var context = this,
                args = arguments;

            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function getScript(source, beforeEl) {
        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            var prior = beforeEl || document.getElementsByTagName('script')[0];

            script.async = true;
            script.defer = true;

            // eslint-disable-next-line shopify/prefer-early-return
            function onloadHander(_, isAbort) {
                if (
                    isAbort ||
                    !script.readyState ||
                    /loaded|complete/.test(script.readyState)
                ) {
                    script.onload = null;
                    script.onreadystatechange = null;
                    script = undefined;

                    if (isAbort) {
                        reject();
                    } else {
                        resolve();
                    }
                }
            }

            script.onload = onloadHander;
            script.onreadystatechange = onloadHander;

            script.src = source;
            prior.parentNode.insertBefore(script, prior);
        });
    }

    /* Based on the prepareTransition by Jonathan Snook */
    /* Jonathan Snook - MIT License - https://github.com/snookca/prepareTransition */
    function prepareTransition(element) {
        element.addEventListener(
            'transitionend',
            function(event) {
                event.currentTarget.classList.remove('is-transitioning');
            },
            { once: true }
        );

        var properties = [
            'transition-duration',
            '-moz-transition-duration',
            '-webkit-transition-duration',
            '-o-transition-duration'
        ];

        var duration = 0;

        properties.forEach(function(property) {
            var computedValue = getComputedStyle(element)[property];

            if (computedValue) {
                computedValue.replace(/\D/g, '');
                duration || (duration = parseFloat(computedValue));
            }
        });

        if (duration !== 0) {
            element.classList.add('is-transitioning');
            element.offsetWidth;
        }
    }

    /*!
     * Serialize all form data into a SearchParams string
     * (c) 2020 Chris Ferdinandi, MIT License, https://gomakethings.com
     * @param  {Node}   form The form to serialize
     * @return {String}      The serialized form data
     */
    function serialize(form) {
        var arr = [];
        Array.prototype.slice.call(form.elements).forEach(function(field) {
            if (
                !field.name ||
                field.disabled ||
                ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1
            )
                return;
            if (field.type === 'select-multiple') {
                Array.prototype.slice.call(field.options).forEach(function(option) {
                    if (!option.selected) return;
                    arr.push(
                        encodeURIComponent(field.name) +
                        '=' +
                        encodeURIComponent(option.value)
                    );
                });
                return;
            }
            if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked)
                return;
            arr.push(
                encodeURIComponent(field.name) + '=' + encodeURIComponent(field.value)
            );
        });
        return arr.join('&');
    }
    function cookiesEnabled() {
        var cookieEnabled = navigator.cookieEnabled;

        if (!cookieEnabled) {
            document.cookie = 'testcookie';
            cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
        }

        return cookieEnabled;
    }

    function promiseStylesheet(stylesheet) {
        var stylesheetUrl = stylesheet || theme.stylesheet;

        if (typeof this.stylesheetPromise === 'undefined') {
            this.stylesheetPromise = new Promise(function(resolve) {
                var link = document.querySelector('link[href="' + stylesheetUrl + '"]');

                if (link.loaded) resolve();

                link.addEventListener('load', function() {
                    setTimeout(resolve, 0);
                });
            });
        }

        return this.stylesheetPromise;
    }

    return {
        setTouch: setTouch,
        isTouch: isTouch,
        enableScrollLock: enableScrollLock,
        disableScrollLock: disableScrollLock,
        debounce: debounce,
        getScript: getScript,
        prepareTransition: prepareTransition,
        serialize: serialize,
        cookiesEnabled: cookiesEnabled,
        promiseStylesheet: promiseStylesheet
    };
})();

export default Helpers;