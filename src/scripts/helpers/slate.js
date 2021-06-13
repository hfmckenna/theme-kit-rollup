export const utils = {
    /**
     * Get the query params in a Url
     * Ex
     * https://mysite.com/search?q=noodles&b
     * getParameterByName('q') = "noodles"
     * getParameterByName('b') = "" (empty value)
     * getParameterByName('test') = null (absent)
     */
    getParameterByName: function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },

    resizeSelects: function (selects) {
        selects.forEach(function (select) {
            var arrowWidth = 55;

            var test = document.createElement('span');
            test.innerHTML = select.selectedOptions[0].label;

            document.querySelector('.site-footer').appendChild(test);

            var width = test.offsetWidth + arrowWidth;
            test.remove();

            select.style.width = width + 'px';
        });
    },

    keyboardKeys: {
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27,
        LEFTARROW: 37,
        RIGHTARROW: 39
    }
};

export const rte = {
    /**
     * Wrap tables in a container div to make them scrollable when needed
     *
     * @param {object} options - Options to be used
     * @param {NodeList} options.tables - Elements of the table(s) to wrap
     * @param {string} options.tableWrapperClass - table wrapper class name
     */
    wrapTable: function (options) {
        options.tables.forEach(function (table) {
            var wrapper = document.createElement('div');
            wrapper.classList.add(options.tableWrapperClass);

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    },

    /**
     * Wrap iframes in a container div to make them responsive
     *
     * @param {object} options - Options to be used
     * @param {NodeList} options.iframes - Elements of the iframe(s) to wrap
     * @param {string} options.iframeWrapperClass - class name used on the wrapping div
     */
    wrapIframe: function (options) {
        options.iframes.forEach(function (iframe) {
            var wrapper = document.createElement('div');
            wrapper.classList.add(options.iframeWrapperClass);

            iframe.parentNode.insertBefore(wrapper, iframe);
            wrapper.appendChild(iframe);

            iframe.src = iframe.src;
        });
    }
};

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

export const Variants = (function () {
    /**
     * Variant constructor
     *
     * @param {object} options - Settings from `product.js`
     */
    function Variants(options) {
        this.container = options.container;
        this.product = options.product;
        this.originalSelectorId = options.originalSelectorId;
        this.enableHistoryState = options.enableHistoryState;
        this.singleOptions = this.container.querySelectorAll(
            options.singleOptionSelector
        );
        this.currentVariant = this._getVariantFromOptions();

        this.singleOptions.forEach(
            function (option) {
                option.addEventListener('change', this._onSelectChange.bind(this));
            }.bind(this)
        );
    }

    Variants.prototype = Object.assign({}, Variants.prototype, {
        /**
         * Get the currently selected options from add-to-cart form. Works with all
         * form input elements.
         *
         * @return {array} options - Values of currently selected variants
         */
        _getCurrentOptions: function () {
            var result = [];

            this.singleOptions.forEach(function (option) {
                var type = option.getAttribute('type');
                var isRadioOrCheckbox = type === 'radio' || type === 'checkbox';

                if (!isRadioOrCheckbox || option.checked) {
                    result.push({
                        value: option.value,
                        index: option.getAttribute('data-index')
                    });
                }
            });

            return result;
        },

        /**
         * Find variant based on selected values.
         *
         * @param  {array} selectedValues - Values of variant inputs
         * @return {object || undefined} found - Variant object from product.variants
         */
        _getVariantFromOptions: function () {
            var selectedValues = this._getCurrentOptions();
            var variants = this.product.variants;

            var found = variants.find(function (variant) {
                return selectedValues.every(function (values) {
                    return variant[values.index] === values.value;
                });
            });

            return found;
        },

        /**
         * Event handler for when a variant input changes.
         */
        _onSelectChange: function () {
            var variant = this._getVariantFromOptions();

            this.container.dispatchEvent(
                new CustomEvent('variantChange', {
                    detail: {
                        variant: variant
                    },
                    bubbles: true,
                    cancelable: true
                })
            );

            if (!variant) {
                return;
            }

            this._updateMasterSelect(variant);
            this._updateImages(variant);
            this._updatePrice(variant);
            this._updateSKU(variant);
            this.currentVariant = variant;

            if (this.enableHistoryState) {
                this._updateHistoryState(variant);
            }
        },

        /**
         * Trigger event when variant image changes
         *
         * @param  {object} variant - Currently selected variant
         * @return {event}  variantImageChange
         */
        _updateImages: function (variant) {
            var variantImage = variant.featured_image || {};
            var currentVariantImage = this.currentVariant.featured_image || {};

            if (
                !variant.featured_image ||
                variantImage.src === currentVariantImage.src
            ) {
                return;
            }

            this.container.dispatchEvent(
                new CustomEvent('variantImageChange', {
                    detail: {
                        variant: variant
                    },
                    bubbles: true,
                    cancelable: true
                })
            );
        },

        /**
         * Trigger event when variant price changes.
         *
         * @param  {object} variant - Currently selected variant
         * @return {event} variantPriceChange
         */
        _updatePrice: function (variant) {
            if (
                variant.price === this.currentVariant.price &&
                variant.compare_at_price === this.currentVariant.compare_at_price &&
                variant.unit_price === this.currentVariant.unit_price
            ) {
                return;
            }

            this.container.dispatchEvent(
                new CustomEvent('variantPriceChange', {
                    detail: {
                        variant: variant
                    },
                    bubbles: true,
                    cancelable: true
                })
            );
        },

        /**
         * Trigger event when variant sku changes.
         *
         * @param  {object} variant - Currently selected variant
         * @return {event} variantSKUChange
         */
        _updateSKU: function (variant) {
            if (variant.sku === this.currentVariant.sku) {
                return;
            }

            this.container.dispatchEvent(
                new CustomEvent('variantSKUChange', {
                    detail: {
                        variant: variant
                    },
                    bubbles: true,
                    cancelable: true
                })
            );
        },

        /**
         * Update history state for product deeplinking
         *
         * @param  {variant} variant - Currently selected variant
         * @return {k}         [description]
         */
        _updateHistoryState: function (variant) {
            if (!history.replaceState || !variant) {
                return;
            }

            var newurl =
                window.location.protocol +
                '//' +
                window.location.host +
                window.location.pathname +
                '?variant=' +
                variant.id;
            window.history.replaceState({path: newurl}, '', newurl);
        },

        /**
         * Update hidden master select of variant change
         *
         * @param  {variant} variant - Currently selected variant
         */
        _updateMasterSelect: function (variant) {
            var masterSelect = this.container.querySelector(this.originalSelectorId);

            if (!masterSelect) return;
            masterSelect.value = variant.id;
        }
    });

    return Variants;
})();

export const a11y = {
    state: {
        firstFocusable: null,
        lastFocusable: null
    },
    /**
     * For use when focus shifts to a container rather than a link
     * eg for In-page links, after scroll, focus shifts to content area so that
     * next `tab` is where user expects
     *
     * @param {HTMLElement} element - The element to be acted upon
     */
    pageLinkFocus: function(element) {
        if (!element) return;
        var focusClass = 'js-focus-hidden';

        element.setAttribute('tabIndex', '-1');
        element.focus();
        element.classList.add(focusClass);
        element.addEventListener('blur', callback, { once: true });

        function callback() {
            element.classList.remove(focusClass);
            element.removeAttribute('tabindex');
        }
    },

    /**
     * Traps the focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {HTMLElement} options.container - Container to trap focus within
     * @param {HTMLElement} options.elementToFocus - Element to be focused when focus leaves container
     */
    trapFocus: function(options) {
        var focusableElements = Array.from(
            options.container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])'
            )
        ).filter(function(element) {
            var width = element.offsetWidth;
            var height = element.offsetHeight;

            return (
                width !== 0 &&
                height !== 0 &&
                getComputedStyle(element).getPropertyValue('display') !== 'none'
            );
        });

        this.state.firstFocusable = focusableElements[0];
        this.state.lastFocusable = focusableElements[focusableElements.length - 1];

        if (!options.elementToFocus) {
            options.elementToFocus = options.container;
        }

        options.container.setAttribute('tabindex', '-1');
        options.elementToFocus.focus();

        this._setupHandlers();

        document.addEventListener('focusin', this._onFocusInHandler);
        document.addEventListener('focusout', this._onFocusOutHandler);
    },

    _setupHandlers: function() {
        if (!this._onFocusInHandler) {
            this._onFocusInHandler = this._onFocusIn.bind(this);
        }

        if (!this._onFocusOutHandler) {
            this._onFocusOutHandler = this._onFocusIn.bind(this);
        }

        if (!this._manageFocusHandler) {
            this._manageFocusHandler = this._manageFocus.bind(this);
        }
    },

    _onFocusOut: function() {
        document.removeEventListener('keydown', this._manageFocusHandler);
    },

    _onFocusIn: function(evt) {
        if (
            evt.target !== this.state.lastFocusable &&
            evt.target !== this.state.firstFocusable
        )
            return;

        document.addEventListener('keydown', this._manageFocusHandler);
    },

    _manageFocus: function(evt) {
        if (evt.keyCode !== utils.keyboardKeys.TAB) return;

        /**
         * On the last focusable element and tab forward,
         * focus the first element.
         */
        if (evt.target === this.state.lastFocusable && !evt.shiftKey) {
            evt.preventDefault();
            this.state.firstFocusable.focus();
        }
        /**
         * On the first focusable element and tab backward,
         * focus the last element.
         */
        if (evt.target === this.state.firstFocusable && evt.shiftKey) {
            evt.preventDefault();
            this.state.lastFocusable.focus();
        }
    },

    /**
     * Removes the trap of focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {HTMLElement} options.container - Container to trap focus within
     */
    removeTrapFocus: function(options) {
        if (options.container) {
            options.container.removeAttribute('tabindex');
        }
        document.removeEventListener('focusin', this._onFocusInHandler);
    },

    /**
     * Add aria-describedby attribute to external and new window links
     *
     * @param {object} options - Options to be used
     * @param {object} options.messages - Custom messages to be used
     * @param {HTMLElement} options.links - Specific links to be targeted
     */
    accessibleLinks: function(options) {
        var body = document.querySelector('body');

        var idSelectors = {
            newWindow: 'a11y-new-window-message',
            external: 'a11y-external-message',
            newWindowExternal: 'a11y-new-window-external-message'
        };

        if (options.links === undefined || !options.links.length) {
            options.links = document.querySelectorAll(
                'a[href]:not([aria-describedby])'
            );
        }

        function generateHTML(customMessages) {
            if (typeof customMessages !== 'object') {
                customMessages = {};
            }

            var messages = Object.assign(
                {
                    newWindow: 'Opens in a new window.',
                    external: 'Opens external website.',
                    newWindowExternal: 'Opens external website in a new window.'
                },
                customMessages
            );

            var container = document.createElement('ul');
            var htmlMessages = '';

            for (var message in messages) {
                htmlMessages +=
                    '<li id=' + idSelectors[message] + '>' + messages[message] + '</li>';
            }

            container.setAttribute('hidden', true);
            container.innerHTML = htmlMessages;

            body.appendChild(container);
        }

        function _externalSite(link) {
            var hostname = window.location.hostname;

            return link.hostname !== hostname;
        }

        options.links.forEach(function(link) {
            var target = link.getAttribute('target');
            var rel = link.getAttribute('rel');
            var isExternal = _externalSite(link);
            var isTargetBlank = target === '_blank';

            if (isExternal) {
                link.setAttribute('aria-describedby', idSelectors.external);
            }

            if (isTargetBlank) {
                if (!rel || rel.indexOf('noopener') === -1) {
                    var relValue = rel === undefined ? '' : rel + ' ';
                    relValue = relValue + 'noopener';
                    link.setAttribute('rel', relValue);
                }

                link.setAttribute('aria-describedby', idSelectors.newWindow);
            }

            if (isExternal && isTargetBlank) {
                link.setAttribute('aria-describedby', idSelectors.newWindowExternal);
            }
        });

        generateHTML(options.messages);
    }
};