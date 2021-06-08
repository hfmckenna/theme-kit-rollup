const Cart = function () {
    this.onLoad = function () {

        var selectors = {
            cartCount: '[data-cart-count]',
            cartCountBubble: '[data-cart-count-bubble]',
            cartDiscount: '[data-cart-discount]',
            cartDiscountTitle: '[data-cart-discount-title]',
            cartDiscountAmount: '[data-cart-discount-amount]',
            cartDiscountWrapper: '[data-cart-discount-wrapper]',
            cartErrorMessage: '[data-cart-error-message]',
            cartErrorMessageWrapper: '[data-cart-error-message-wrapper]',
            cartItem: '[data-cart-item]',
            cartItemDetails: '[data-cart-item-details]',
            cartItemDiscount: '[data-cart-item-discount]',
            cartItemDiscountedPriceGroup: '[data-cart-item-discounted-price-group]',
            cartItemDiscountTitle: '[data-cart-item-discount-title]',
            cartItemDiscountAmount: '[data-cart-item-discount-amount]',
            cartItemDiscountList: '[data-cart-item-discount-list]',
            cartItemFinalPrice: '[data-cart-item-final-price]',
            cartItemImage: '[data-cart-item-image]',
            cartItemLinePrice: '[data-cart-item-line-price]',
            cartItemOriginalPrice: '[data-cart-item-original-price]',
            cartItemPrice: '[data-cart-item-price]',
            cartItemPriceList: '[data-cart-item-price-list]',
            cartItemProperty: '[data-cart-item-property]',
            cartItemPropertyName: '[data-cart-item-property-name]',
            cartItemPropertyValue: '[data-cart-item-property-value]',
            cartItemRegularPriceGroup: '[data-cart-item-regular-price-group]',
            cartItemRegularPrice: '[data-cart-item-regular-price]',
            cartItemTitle: '[data-cart-item-title]',
            cartItemOption: '[data-cart-item-option]',
            cartItemSellingPlanName: '[data-cart-item-selling-plan-name]',
            cartLineItems: '[data-cart-line-items]',
            cartNote: '[data-cart-notes]',
            cartQuantityErrorMessage: '[data-cart-quantity-error-message]',
            cartQuantityErrorMessageWrapper:
                '[data-cart-quantity-error-message-wrapper]',
            cartRemove: '[data-cart-remove]',
            cartStatus: '[data-cart-status]',
            cartSubtotal: '[data-cart-subtotal]',
            cartTableCell: '[data-cart-table-cell]',
            cartWrapper: '[data-cart-wrapper]',
            emptyPageContent: '[data-empty-page-content]',
            quantityInput: '[data-quantity-input]',
            quantityInputMobile: '[data-quantity-input-mobile]',
            quantityInputDesktop: '[data-quantity-input-desktop]',
            quantityLabelMobile: '[data-quantity-label-mobile]',
            quantityLabelDesktop: '[data-quantity-label-desktop]',
            inputQty: '[data-quantity-input]',
            thumbnails: '.cart__image',
            unitPrice: '[data-unit-price]',
            unitPriceBaseUnit: '[data-unit-price-base-unit]',
            unitPriceGroup: '[data-unit-price-group]'
        };

        var classes = {
            cartNoCookies: 'cart--no-cookies',
            cartRemovedProduct: 'cart__removed-product',
            thumbnails: 'cart__image',
            hide: 'hide',
            inputError: 'input--error'
        };

        var attributes = {
            cartItemIndex: 'data-cart-item-index',
            cartItemKey: 'data-cart-item-key',
            cartItemQuantity: 'data-cart-item-quantity',
            cartItemTitle: 'data-cart-item-title',
            cartItemUrl: 'data-cart-item-url',
            quantityItem: 'data-quantity-item'
        };

        var mediumUpQuery = '(min-width: ' + theme.breakpoints.medium + 'px)';

        this.thumbnails = this.container.querySelectorAll(selectors.thumbnails);
        this.quantityInputs = this.container.querySelectorAll(selectors.inputQty);
        this.ajaxEnabled =
            this.container.getAttribute('data-ajax-enabled') === 'true';

        this.cartRoutes = JSON.parse(
            document.querySelector('[data-cart-routes]').innerHTML
        );

        this._handleInputQty = theme.Helpers.debounce(
            this._handleInputQty.bind(this),
            500
        );
        this.setQuantityFormControllers = this.setQuantityFormControllers.bind(
            this
        );
        this._onNoteChange = this._onNoteChange.bind(this);
        this._onRemoveItem = this._onRemoveItem.bind(this);

        if (!theme.Helpers.cookiesEnabled()) {
            this.container.classList.add(classes.cartNoCookies);
        }

        this.thumbnails.forEach(function (element) {
            element.style.cursor = 'pointer';
        });

        this.container.addEventListener('click', this._handleThumbnailClick);
        this.container.addEventListener('change', this._handleInputQty);

        this.mql = window.matchMedia(mediumUpQuery);
        this.mql.addListener(this.setQuantityFormControllers);

        this.setQuantityFormControllers();

        if (this.ajaxEnabled) {
            /**
             * Because the entire cart is recreated when a cart item is updated,
             * we cannot cache the elements in the cart. Instead, we add the event
             * listeners on the cart's container to allow us to retain the event
             * listeners after rebuilding the cart when an item is updated.
             */
            this.container.addEventListener('click', this._onRemoveItem);
            this.container.addEventListener('change', this._onNoteChange);

            this._setupCartTemplates();
        }
    }

    this._setupCartTemplates = function () {
        var cartItem = this.container.querySelector(selectors.cartItem);
        if (!cartItem) return;

        this.itemTemplate = this.container
            .querySelector(selectors.cartItem)
            .cloneNode(true);

        this.itemDiscountTemplate = this.itemTemplate
            .querySelector(selectors.cartItemDiscount)
            .cloneNode(true);

        this.cartDiscountTemplate = this.container
            .querySelector(selectors.cartDiscount)
            .cloneNode(true);

        this.itemPriceListTemplate = this.itemTemplate
            .querySelector(selectors.cartItemPriceList)
            .cloneNode(true);

        this.itemOptionTemplate = this.itemTemplate
            .querySelector(selectors.cartItemOption)
            .cloneNode(true);

        this.itemPropertyTemplate = this.itemTemplate
            .querySelector(selectors.cartItemProperty)
            .cloneNode(true);

        this.itemSellingPlanNameTemplate = this.itemTemplate
            .querySelector(selectors.cartItemSellingPlanName)
            .cloneNode(true);
    }

    this._handleInputQty = function (evt) {
        if (!evt.target.hasAttribute('data-quantity-input')) return;

        var input = evt.target;
        var itemElement = input.closest(selectors.cartItem);

        var itemIndex = Number(input.getAttribute('data-quantity-item'));

        var itemQtyInputs = this.container.querySelectorAll(
            "[data-quantity-item='" + itemIndex + "']"
        );

        var value = parseInt(input.value);

        var isValidValue = !(value < 0 || isNaN(value));

        itemQtyInputs.forEach(function (element) {
            element.value = value;
        });

        this._hideCartError();
        this._hideQuantityErrorMessage();

        if (!isValidValue) {
            this._showQuantityErrorMessages(itemElement);
            return;
        }

        if (isValidValue && this.ajaxEnabled) {
            this._updateItemQuantity(itemIndex, itemElement, itemQtyInputs, value);
        }
    }

    this._updateItemQuantity = function (
        itemIndex,
        itemElement,
        itemQtyInputs,
        value
    ) {
        var key = itemElement.getAttribute(attributes.cartItemKey);
        var index = Number(itemElement.getAttribute(attributes.cartItemIndex));

        var request = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;'
            },
            body: JSON.stringify({
                line: index,
                quantity: value
            })
        };

        fetch(this.cartRoutes.cartChangeUrl + '.js', request)
            .then(function (response) {
                return response.json();
            })
            .then(
                function (state) {
                    this._setCartCountBubble(state.item_count);

                    if (!state.item_count) {
                        this._emptyCart();
                        return;
                    }

                    // Cache current in-focus element, used later to restore focus
                    var inFocus = document.activeElement;

                    this._createCart(state);

                    if (!value) {
                        this._showRemoveMessage(itemElement.cloneNode(true));
                        return;
                    }

                    var item = this.getItem(key, state);

                    this._updateLiveRegion(item);

                    // Restore focus to the "equivalent" element after the DOM has been updated
                    if (!inFocus) return;
                    var row = inFocus.closest('[' + attributes.cartItemIndex + ']');
                    if (!row) return;
                    var target = this.container.querySelector(
                        '[' +
                        attributes.cartItemIndex +
                        '="' +
                        row.getAttribute(attributes.cartItemIndex) +
                        '"] [data-role="' +
                        inFocus.getAttribute('data-role') +
                        '"]'
                    );
                    if (!target) return;
                    target.focus();
                }.bind(this)
            )
            .catch(
                function () {
                    this._showCartError(null);
                }.bind(this)
            );
    }

    this.getItem = function (key, state) {
        return state.items.find(function (item) {
            return item.key === key;
        });
    }

    this._liveRegionText = function (item) {
        // Dummy content for live region
        var liveRegionText =
            theme.strings.update +
            ': [QuantityLabel]: [Quantity], [Regular] [$$] [DiscountedPrice] [$]. [PriceInformation]';

        // Update Quantity
        liveRegionText = liveRegionText
            .replace('[QuantityLabel]', theme.strings.quantity)
            .replace('[Quantity]', item.quantity);

        // Update pricing information
        var regularLabel = '';
        var regularPrice = theme.Currency.formatMoney(
            item.original_line_price,
            theme.moneyFormat
        );
        var discountLabel = '';
        var discountPrice = '';
        var discountInformation = '';

        if (item.original_line_price > item.final_line_price) {
            regularLabel = theme.strings.regularTotal;

            discountLabel = theme.strings.discountedTotal;
            discountPrice = theme.Currency.formatMoney(
                item.final_line_price,
                theme.moneyFormat
            );

            discountInformation = theme.strings.priceColumn;
        }

        liveRegionText = liveRegionText
            .replace('[Regular]', regularLabel)
            .replace('[$$]', regularPrice)
            .replace('[DiscountedPrice]', discountLabel)
            .replace('[$]', discountPrice)
            .replace('[PriceInformation]', discountInformation)
            .trim();

        return liveRegionText;
    }

    this._updateLiveRegion = function (item) {
        if (!item) return;

        var liveRegion = this.container.querySelector(selectors.cartStatus);

        liveRegion.textContent = this._liveRegionText(item);
        liveRegion.setAttribute('aria-hidden', false);

        setTimeout(function () {
            liveRegion.setAttribute('aria-hidden', true);
        }, 1000);
    }

    this._createCart = function (state) {
        var cartDiscountList = this._createCartDiscountList(state);

        var cartTable = this.container.querySelector(selectors.cartLineItems);
        cartTable.innerHTML = '';

        this._createLineItemList(state).forEach(function (lineItem) {
            cartTable.appendChild(lineItem);
        });

        this.setQuantityFormControllers();

        this.cartNotes =
            this.cartNotes || this.container.querySelector(selectors.cartNote);

        if (this.cartNotes) {
            this.cartNotes.value = state.note;
        }

        var discountWrapper = this.container.querySelector(
            selectors.cartDiscountWrapper
        );

        if (cartDiscountList.length === 0) {
            discountWrapper.innerHTML = '';
            discountWrapper.classList.add(classes.hide);
        } else {
            discountWrapper.innerHTML = '';

            cartDiscountList.forEach(function (discountItem) {
                discountWrapper.appendChild(discountItem);
            });

            discountWrapper.classList.remove(classes.hide);
        }

        this.container.querySelector(
            selectors.cartSubtotal
        ).innerHTML = theme.Currency.formatMoney(
            state.total_price,
            theme.moneyFormatWithCurrency
        );
    }

    this._createCartDiscountList = function (cart) {
        return cart.cart_level_discount_applications.map(
            function (discount) {
                var discountNode = this.cartDiscountTemplate.cloneNode(true);

                discountNode.querySelector(selectors.cartDiscountTitle).textContent =
                    discount.title;

                discountNode.querySelector(
                    selectors.cartDiscountAmount
                ).innerHTML = theme.Currency.formatMoney(
                    discount.total_allocated_amount,
                    theme.moneyFormat
                );

                return discountNode;
            }.bind(this)
        );
    }

    this._createLineItemList = function (state) {
        return state.items.map(
            function (item, index) {
                var itemNode = this.itemTemplate.cloneNode(true);

                var itemPriceList = this.itemPriceListTemplate.cloneNode(true);

                this._setLineItemAttributes(itemNode, item, index);
                this._setLineItemImage(itemNode, item.featured_image);

                var cartItemTitle = itemNode.querySelector(selectors.cartItemTitle);
                cartItemTitle.textContent = item.product_title;
                cartItemTitle.setAttribute('href', item.url);

                var selling_plan_name = item.selling_plan_allocation
                    ? item.selling_plan_allocation.selling_plan.name
                    : null;

                var productDetailsList = this._createProductDetailsList(
                    item.product_has_only_default_variant,
                    item.options_with_values,
                    item.properties,
                    selling_plan_name
                );

                this._setProductDetailsList(itemNode, productDetailsList);

                this._setItemRemove(itemNode, item.title);

                itemPriceList.innerHTML = this._createItemPrice(
                    item.original_price,
                    item.final_price
                ).outerHTML;

                if (item.unit_price_measurement) {
                    itemPriceList.appendChild(
                        this._createUnitPrice(
                            item.unit_price,
                            item.unit_price_measurement
                        )
                    );
                }

                this._setItemPrice(itemNode, itemPriceList);

                var itemDiscountList = this._createItemDiscountList(item);
                this._setItemDiscountList(itemNode, itemDiscountList);
                this._setQuantityInputs(itemNode, item, index);

                var itemLinePrice = this._createItemPrice(
                    item.original_line_price,
                    item.final_line_price
                );

                this._setItemLinePrice(itemNode, itemLinePrice);

                return itemNode;
            }.bind(this)
        );
    }

    this._setLineItemAttributes = function (itemNode, item, index) {
        itemNode.setAttribute(attributes.cartItemKey, item.key);
        itemNode.setAttribute(attributes.cartItemUrl, item.url);
        itemNode.setAttribute(attributes.cartItemTitle, item.title);
        itemNode.setAttribute(attributes.cartItemIndex, index + 1);
        itemNode.setAttribute(attributes.cartItemQuantity, item.quantity);
    }

    this._setLineItemImage = function (itemNode, featuredImage) {
        var image = itemNode.querySelector(selectors.cartItemImage);

        var sizedImageUrl =
            featuredImage.url !== null
                ? theme.Images.getSizedImageUrl(featuredImage.url, 'x190')
                : null;

        if (sizedImageUrl) {
            image.setAttribute('alt', featuredImage.alt);
            image.setAttribute('src', sizedImageUrl);
            image.classList.remove(classes.hide);
        } else {
            image.parentNode.removeChild(image);
        }
    }

    this._setProductDetailsList = function (item, productDetailsList) {
        var itemDetails = item.querySelector(selectors.cartItemDetails);

        if (productDetailsList.length) {
            itemDetails.classList.remove(classes.hide);
            itemDetails.innerHTML = productDetailsList.reduce(function (
                result,
                element
                ) {
                    return result + element.outerHTML;
                },
                '');

            return;
        }

        itemDetails.classList.add(classes.hide);
        itemDetails.textContent = '';
    }

    this._setItemPrice = function (item, price) {
        item.querySelector(selectors.cartItemPrice).innerHTML = price.outerHTML;
    }

    this._setItemDiscountList = function (item, discountList) {
        var itemDiscountList = item.querySelector(selectors.cartItemDiscountList);

        if (discountList.length === 0) {
            itemDiscountList.innerHTML = '';
            itemDiscountList.classList.add(classes.hide);
        } else {
            itemDiscountList.innerHTML = discountList.reduce(function (
                result,
                element
                ) {
                    return result + element.outerHTML;
                },
                '');

            itemDiscountList.classList.remove(classes.hide);
        }
    }

    this._setItemRemove = function (item, title) {
        item
            .querySelector(selectors.cartRemove)
            .setAttribute(
                'aria-label',
                theme.strings.removeLabel.replace('[product]', title)
            );
    }

    this._setQuantityInputs = function (itemNode, item, index) {
        var mobileInput = itemNode.querySelector(selectors.quantityInputMobile);
        var desktopInput = itemNode.querySelector(selectors.quantityInputDesktop);

        mobileInput.setAttribute('id', 'updates_' + item.key);
        desktopInput.setAttribute('id', 'updates_large_' + item.key);

        [mobileInput, desktopInput].forEach(function (element) {
            element.setAttribute(attributes.quantityItem, index + 1);
            element.value = item.quantity;
        });

        itemNode
            .querySelector(selectors.quantityLabelMobile)
            .setAttribute('for', 'updates_' + item.key);

        itemNode
            .querySelector(selectors.quantityLabelDesktop)
            .setAttribute('for', 'updates_large_' + item.key);
    }

    this.setQuantityFormControllers = function () {
        var desktopQuantityInputs = document.querySelectorAll(
            selectors.quantityInputDesktop
        );

        var mobileQuantityInputs = document.querySelectorAll(
            selectors.quantityInputMobile
        );

        if (this.mql.matches) {
            addNameAttribute(desktopQuantityInputs);
            removeNameAttribute(mobileQuantityInputs);
        } else {
            addNameAttribute(mobileQuantityInputs);
            removeNameAttribute(desktopQuantityInputs);
        }

        function addNameAttribute(inputs) {
            inputs.forEach(function (element) {
                element.setAttribute('name', 'updates[]');
            });
        }

        function removeNameAttribute(inputs) {
            inputs.forEach(function (element) {
                element.removeAttribute('name');
            });
        }
    }

    this._setItemLinePrice = function (item, price) {
        item.querySelector(selectors.cartItemLinePrice).innerHTML =
            price.outerHTML;
    }

    this._createProductDetailsList = function (
        product_has_only_default_variant,
        options,
        properties,
        selling_plan_name
    ) {
        var optionsPropertiesHTML = [];

        if (!product_has_only_default_variant) {
            optionsPropertiesHTML = optionsPropertiesHTML.concat(
                this._getOptionList(options)
            );
        }

        if (selling_plan_name) {
            optionsPropertiesHTML = optionsPropertiesHTML.concat(
                this._getSellingPlanName(selling_plan_name)
            );
        }

        if (properties !== null && Object.keys(properties).length !== 0) {
            optionsPropertiesHTML = optionsPropertiesHTML.concat(
                this._getPropertyList(properties)
            );
        }

        return optionsPropertiesHTML;
    }

    this._getOptionList = function (options) {
        return options.map(
            function (option) {
                var optionElement = this.itemOptionTemplate.cloneNode(true);

                optionElement.textContent = option.name + ': ' + option.value;
                optionElement.classList.remove(classes.hide);

                return optionElement;
            }.bind(this)
        );
    }

    this._getPropertyList = function (properties) {
        var propertiesArray =
            properties !== null ? Object.entries(properties) : [];

        var filteredPropertiesArray = propertiesArray.filter(function (property) {
            // Line item properties prefixed with an underscore are not to be displayed
            // if the property value has a length of 0 (empty), don't display it
            if (property[0].charAt(0) === '_' || property[1].length === 0) {
                return false;
            } else {
                return true;
            }
        });

        return filteredPropertiesArray.map(
            function (property) {
                var propertyElement = this.itemPropertyTemplate.cloneNode(true);

                propertyElement.querySelector(
                    selectors.cartItemPropertyName
                ).textContent = property[0] + ': ';

                if (property[0].indexOf('/uploads/') === -1) {
                    propertyElement.querySelector(
                        selectors.cartItemPropertyValue
                    ).textContent = property[1];
                } else {
                    propertyElement.querySelector(
                        selectors.cartItemPropertyValue
                    ).innerHTML =
                        '<a href="' +
                        property[1] +
                        '"> ' +
                        property[1].split('/').pop() +
                        '</a>';
                }

                propertyElement.classList.remove(classes.hide);

                return propertyElement;
            }.bind(this)
        );
    }

    this._getSellingPlanName = function (selling_plan_name) {
        var sellingPlanNameElement = this.itemSellingPlanNameTemplate.cloneNode(
            true
        );

        sellingPlanNameElement.textContent = selling_plan_name;
        sellingPlanNameElement.classList.remove(classes.hide);

        return sellingPlanNameElement;
    }

    this._createItemPrice = function (original_price, final_price) {
        var originalPriceHTML = theme.Currency.formatMoney(
            original_price,
            theme.moneyFormat
        );

        var resultHTML;

        if (original_price !== final_price) {
            resultHTML = this.itemPriceListTemplate
                .querySelector(selectors.cartItemDiscountedPriceGroup)
                .cloneNode(true);

            resultHTML.querySelector(
                selectors.cartItemOriginalPrice
            ).innerHTML = originalPriceHTML;

            resultHTML.querySelector(
                selectors.cartItemFinalPrice
            ).innerHTML = theme.Currency.formatMoney(
                final_price,
                theme.moneyFormat
            );
        } else {
            resultHTML = this.itemPriceListTemplate
                .querySelector(selectors.cartItemRegularPriceGroup)
                .cloneNode(true);

            resultHTML.querySelector(
                selectors.cartItemRegularPrice
            ).innerHTML = originalPriceHTML;
        }

        resultHTML.classList.remove(classes.hide);
        return resultHTML;
    }

    this._createUnitPrice = function (unitPrice, unitPriceMeasurement) {
        var unitPriceGroup = this.itemPriceListTemplate
            .querySelector(selectors.unitPriceGroup)
            .cloneNode(true);

        var unitPriceBaseUnit =
            (unitPriceMeasurement.reference_value !== 1
                ? unitPriceMeasurement.reference_value
                : '') + unitPriceMeasurement.reference_unit;

        unitPriceGroup.querySelector(
            selectors.unitPriceBaseUnit
        ).textContent = unitPriceBaseUnit;

        unitPriceGroup.querySelector(
            selectors.unitPrice
        ).innerHTML = theme.Currency.formatMoney(unitPrice, theme.moneyFormat);

        unitPriceGroup.classList.remove(classes.hide);

        return unitPriceGroup;
    }

    this._createItemDiscountList = function (item) {
        return item.line_level_discount_allocations.map(
            function (discount) {
                var discountNode = this.itemDiscountTemplate.cloneNode(true);

                discountNode.querySelector(
                    selectors.cartItemDiscountTitle
                ).textContent = discount.discount_application.title;

                discountNode.querySelector(
                    selectors.cartItemDiscountAmount
                ).innerHTML = theme.Currency.formatMoney(
                    discount.amount,
                    theme.moneyFormat
                );

                return discountNode;
            }.bind(this)
        );
    }

    this._showQuantityErrorMessages = function (itemElement) {
        itemElement
            .querySelectorAll(selectors.cartQuantityErrorMessage)
            .forEach(function (element) {
                element.textContent = theme.strings.quantityMinimumMessage;
            });

        itemElement
            .querySelectorAll(selectors.cartQuantityErrorMessageWrapper)
            .forEach(function (element) {
                element.classList.remove(classes.hide);
            });

        itemElement
            .querySelectorAll(selectors.inputQty)
            .forEach(function (element) {
                element.classList.add(classes.inputError);
                element.focus();
            });
    }

    this._hideQuantityErrorMessage = function () {
        var errorMessages = document.querySelectorAll(
            selectors.cartQuantityErrorMessageWrapper
        );

        errorMessages.forEach(function (element) {
            element.classList.add(classes.hide);

            element.querySelector(selectors.cartQuantityErrorMessage).textContent =
                '';
        });

        this.container
            .querySelectorAll(selectors.inputQty)
            .forEach(function (element) {
                element.classList.remove(classes.inputError);
            });
    }

    this._handleThumbnailClick = function (evt) {
        if (!evt.target.classList.contains(classes.thumbnails)) return;

        window.location.href = evt.target
            .closest(selectors.cartItem)
            .getAttribute('data-cart-item-url');
    }

    this._onNoteChange = function (evt) {
        if (!evt.target.hasAttribute('data-cart-notes')) return;

        var note = evt.target.value;
        this._hideCartError();
        this._hideQuantityErrorMessage();

        var headers = new Headers({'Content-Type': 'application/json'});

        var request = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({note: note})
        };

        fetch('/cart/update.js', request).catch(
            function () {
                this._showCartError(evt.target);
            }.bind(this)
        );
    }

    this._showCartError = function (elementToFocus) {
        document.querySelector(selectors.cartErrorMessage).textContent =
            theme.strings.cartError;

        document
            .querySelector(selectors.cartErrorMessageWrapper)
            .classList.remove(classes.hide);

        if (!elementToFocus) return;
        elementToFocus.focus();
    }

    this._hideCartError = function () {
        document
            .querySelector(selectors.cartErrorMessageWrapper)
            .classList.add(classes.hide);
        document.querySelector(selectors.cartErrorMessage).textContent = '';
    }

    this._onRemoveItem = function (evt) {
        if (!evt.target.hasAttribute('data-cart-remove')) return;

        evt.preventDefault();
        var lineItem = evt.target.closest(selectors.cartItem);
        var index = Number(lineItem.getAttribute(attributes.cartItemIndex));

        this._hideCartError();

        var request = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;'
            },
            body: JSON.stringify({
                line: index,
                quantity: 0
            })
        };

        fetch(this.cartRoutes.cartChangeUrl + '.js', request)
            .then(function (response) {
                return response.json();
            })
            .then(
                function (state) {
                    if (state.item_count === 0) {
                        this._emptyCart();
                    } else {
                        this._createCart(state);
                        this._showRemoveMessage(lineItem.cloneNode(true));
                    }

                    this._setCartCountBubble(state.item_count);
                }.bind(this)
            )
            .catch(
                function () {
                    this._showCartError(null);
                }.bind(this)
            );
    }

    this._showRemoveMessage = function (lineItem) {
        var index = lineItem.getAttribute('data-cart-item-index');
        var removeMessage = this._getRemoveMessage(lineItem);

        if (index - 1 === 0) {
            this.container
                .querySelector('[data-cart-item-index="1"]')
                .insertAdjacentHTML('beforebegin', removeMessage.outerHTML);
        } else {
            this.container
                .querySelector("[data-cart-item-index='" + (index - 1) + "']")
                .insertAdjacentHTML('afterend', removeMessage.outerHTML);
        }

        this.container.querySelector('[data-removed-item-row]').focus();
    }

    this._getRemoveMessage = function (lineItem) {
        var formattedMessage = this._formatRemoveMessage(lineItem);

        var tableCell = lineItem
            .querySelector(selectors.cartTableCell)
            .cloneNode(true);

        tableCell.removeAttribute('class');
        tableCell.classList.add(classes.cartRemovedProduct);
        tableCell.setAttribute('colspan', '4');
        tableCell.innerHTML = formattedMessage;

        lineItem.setAttribute('role', 'alert');
        lineItem.setAttribute('tabindex', '-1');
        lineItem.setAttribute('data-removed-item-row', true);
        lineItem.innerHTML = tableCell.outerHTML;

        return lineItem;
    }

    this._formatRemoveMessage = function (lineItem) {
        var quantity = lineItem.getAttribute('data-cart-item-quantity');
        var url = lineItem.getAttribute(attributes.cartItemUrl);
        var title = lineItem.getAttribute(attributes.cartItemTitle);

        return theme.strings.removedItemMessage
            .replace('[quantity]', quantity)
            .replace(
                '[link]',
                '<a ' +
                'href="' +
                url +
                '" class="text-link text-link--accent">' +
                title +
                '</a>'
            );
    }

    this._setCartCountBubble = function (quantity) {
        this.cartCountBubble =
            this.cartCountBubble ||
            document.querySelector(selectors.cartCountBubble);

        this.cartCount =
            this.cartCount || document.querySelector(selectors.cartCount);

        if (quantity > 0) {
            this.cartCountBubble.classList.remove(classes.hide);
            this.cartCount.textContent = quantity;
        } else {
            this.cartCountBubble.classList.add(classes.hide);
            this.cartCount.textContent = '';
        }
    }

    this._emptyCart = function () {
        this.emptyPageContent =
            this.emptyPageContent ||
            this.container.querySelector(selectors.emptyPageContent);

        this.cartWrapper =
            this.cartWrapper || this.container.querySelector(selectors.cartWrapper);

        this.emptyPageContent.classList.remove(classes.hide);
        this.cartWrapper.classList.add(classes.hide);
    }
}

export default Cart;