/* eslint-disable no-new */
const Product = function () {
    this.onLoad = function () {
        var sectionId = this.id;
        var container = this.container;

        this.zoomPictures = [];
        this.ajaxEnabled = container.getAttribute('data-ajax-enabled') === 'true';

        this.settings = {
            // Breakpoints from src/stylesheets/global/variables.scss.liquid
            mediaQueryMediumUp: 'screen and (min-width: 750px)',
            mediaQuerySmall: 'screen and (max-width: 749px)',
            bpSmall: false,
            enableHistoryState:
                container.getAttribute('data-enable-history-state') === 'true',
            namespace: '.slideshow-' + sectionId,
            sectionId: sectionId,
            sliderActive: false,
            zoomEnabled: false
        };

        this.selectors = {
            addToCart: '[data-add-to-cart]',
            addToCartText: '[data-add-to-cart-text]',
            cartCount: '[data-cart-count]',
            cartCountBubble: '[data-cart-count-bubble]',
            cartPopup: '[data-cart-popup]',
            cartPopupCartQuantity: '[data-cart-popup-cart-quantity]',
            cartPopupClose: '[data-cart-popup-close]',
            cartPopupDismiss: '[data-cart-popup-dismiss]',
            cartPopupImage: '[data-cart-popup-image]',
            cartPopupImageWrapper: '[data-cart-popup-image-wrapper]',
            cartPopupImagePlaceholder: '[data-image-loading-animation]',
            cartPopupProductDetails: '[data-cart-popup-product-details]',
            cartPopupQuantity: '[data-cart-popup-quantity]',
            cartPopupQuantityLabel: '[data-cart-popup-quantity-label]',
            cartPopupTitle: '[data-cart-popup-title]',
            cartPopupWrapper: '[data-cart-popup-wrapper]',
            loader: '[data-loader]',
            loaderStatus: '[data-loader-status]',
            quantity: '[data-quantity-input]',
            SKU: '.variant-sku',
            productStatus: '[data-product-status]',
            originalSelectorId: '#ProductSelect-' + sectionId,
            productForm: '[data-product-form]',
            errorMessage: '[data-error-message]',
            errorMessageWrapper: '[data-error-message-wrapper]',
            imageZoomWrapper: '[data-image-zoom-wrapper]',
            productMediaWrapper: '[data-product-single-media-wrapper]',
            productThumbImages: '.product-single__thumbnail--' + sectionId,
            productThumbs: '.product-single__thumbnails-' + sectionId,
            productThumbListItem: '.product-single__thumbnails-item',
            productThumbsWrapper: '.thumbnails-wrapper',
            saleLabel: '.product-price__sale-label-' + sectionId,
            singleOptionSelector: '.single-option-selector-' + sectionId,
            shopifyPaymentButton: '.shopify-payment-button',
            productMediaTypeVideo: '[data-product-media-type-video]',
            productMediaTypeModel: '[data-product-media-type-model]',
            priceContainer: '[data-price]',
            regularPrice: '[data-regular-price]',
            salePrice: '[data-sale-price]',
            unitPrice: '[data-unit-price]',
            unitPriceBaseUnit: '[data-unit-price-base-unit]',
            productPolicies: '[data-product-policies]',
            storeAvailabilityContainer: '[data-store-availability-container]'
        };

        this.classes = {
            cartPopupWrapperHidden: 'cart-popup-wrapper--hidden',
            hidden: 'hide',
            visibilityHidden: 'visibility-hidden',
            inputError: 'input--error',
            jsZoomEnabled: 'js-zoom-enabled',
            productOnSale: 'price--on-sale',
            productUnitAvailable: 'price--unit-available',
            productUnavailable: 'price--unavailable',
            productSoldOut: 'price--sold-out',
            cartImage: 'cart-popup-item__image',
            productFormErrorMessageWrapperHidden:
                'product-form__error-message-wrapper--hidden',
            activeClass: 'active-thumb',
            variantSoldOut: 'product-form--variant-sold-out'
        };

        this.eventHandlers = {};

        this.quantityInput = container.querySelector(this.selectors.quantity);
        this.errorMessageWrapper = container.querySelector(
            this.selectors.errorMessageWrapper
        );
        this.productForm = container.querySelector(this.selectors.productForm);
        this.addToCart = container.querySelector(this.selectors.addToCart);
        this.addToCartText = this.addToCart.querySelector(
            this.selectors.addToCartText
        );
        this.shopifyPaymentButton = container.querySelector(
            this.selectors.shopifyPaymentButton
        );
        this.priceContainer = container.querySelector(
            this.selectors.priceContainer
        );
        this.productPolicies = container.querySelector(
            this.selectors.productPolicies
        );
        this.storeAvailabilityContainer = container.querySelector(
            this.selectors.storeAvailabilityContainer
        );
        if (this.storeAvailabilityContainer) {
            this._initStoreAvailability();
        }

        this.loader = this.addToCart.querySelector(this.selectors.loader);
        this.loaderStatus = container.querySelector(this.selectors.loaderStatus);

        this.imageZoomWrapper = container.querySelectorAll(
            this.selectors.imageZoomWrapper
        );

        // Stop parsing if we don't have the product json script tag when loading
        // section in the Theme Editor
        var productJson = document.getElementById('ProductJson-' + sectionId);
        if (!productJson || !productJson.innerHTML.length) {
            return;
        }

        this.productSingleObject = JSON.parse(productJson.innerHTML);

        // Initial state for global productState object
        this.productState = {
            available: true,
            soldOut: false,
            onSale: false,
            showUnitPrice: false
        };

        this.settings.zoomEnabled =
            this.imageZoomWrapper.length > 0
                ? this.imageZoomWrapper[0].classList.contains(
                this.classes.jsZoomEnabled
                )
                : false;

        this.cartRoutes = JSON.parse(
            document.querySelector('[data-cart-routes]').innerHTML
        );

        this.initMobileBreakpoint = this._initMobileBreakpoint.bind(this);
        this.initDesktopBreakpoint = this._initDesktopBreakpoint.bind(this);

        this.mqlSmall = window.matchMedia(this.settings.mediaQuerySmall);
        this.mqlSmall.addListener(this.initMobileBreakpoint);

        this.mqlMediumUp = window.matchMedia(this.settings.mediaQueryMediumUp);
        this.mqlMediumUp.addListener(this.initDesktopBreakpoint);

        this.initMobileBreakpoint();
        this.initDesktopBreakpoint();
        this._stringOverrides();
        this._initVariants();
        this._initMediaSwitch();
        this._initAddToCart();
        this._setActiveThumbnail();
        this._initProductVideo();
        this._initModelViewerLibraries();
        this._initShopifyXrLaunch();
    }

    this._stringOverrides = function () {
        theme.productStrings = theme.productStrings || {};
        theme.strings = Object.assign({}, theme.strings, theme.productStrings);
    }

    this._initStoreAvailability = function () {
        this.storeAvailability = new theme.StoreAvailability(
            this.storeAvailabilityContainer
        );

        var storeAvailabilityModalOpenedCallback = function (event) {
            if (
                this.cartPopupWrapper &&
                !this.cartPopupWrapper.classList.contains(
                    this.classes.cartPopupWrapperHidden
                )
            ) {
                this._hideCartPopup(event);
            }
        };

        // hide cart popup modal if the store availability modal is also opened
        this.storeAvailabilityContainer.addEventListener(
            'storeAvailabilityModalOpened',
            storeAvailabilityModalOpenedCallback.bind(this)
        );
    }

    this._initMobileBreakpoint = function () {
        if (this.mqlSmall.matches) {
            // initialize thumbnail slider on mobile if more than four thumbnails
            if (
                this.container.querySelectorAll(this.selectors.productThumbImages)
                    .length > 4
            ) {
                this._initThumbnailSlider();
            }

            // destroy image zooming if enabled
            if (this.settings.zoomEnabled) {
                this.imageZoomWrapper.forEach(
                    function (element, index) {
                        this._destroyZoom(index);
                    }.bind(this)
                );
            }

            this.settings.bpSmall = true;
        } else {
            if (this.settings.sliderActive) {
                this._destroyThumbnailSlider();
            }

            this.settings.bpSmall = false;
        }
    }

    this._initDesktopBreakpoint = function () {
        if (this.mqlMediumUp.matches && this.settings.zoomEnabled) {
            this.imageZoomWrapper.forEach(
                function (element, index) {
                    this._enableZoom(element, index);
                }.bind(this)
            );
        }
    }

    this._initVariants = function () {
        var options = {
            container: this.container,
            enableHistoryState:
                this.container.getAttribute('data-enable-history-state') === 'true',
            singleOptionSelector: this.selectors.singleOptionSelector,
            originalSelectorId: this.selectors.originalSelectorId,
            product: this.productSingleObject
        };

        this.variants = new slate.Variants(options);
        if (this.storeAvailability && this.variants.currentVariant.available) {
            this.storeAvailability.updateContent(this.variants.currentVariant.id);
        }

        this.eventHandlers.updateAvailability = this._updateAvailability.bind(
            this
        );
        this.eventHandlers.updateMedia = this._updateMedia.bind(this);
        this.eventHandlers.updatePrice = this._updatePrice.bind(this);
        this.eventHandlers.updateSKU = this._updateSKU.bind(this);

        this.container.addEventListener(
            'variantChange',
            this.eventHandlers.updateAvailability
        );
        this.container.addEventListener(
            'variantImageChange',
            this.eventHandlers.updateMedia
        );
        this.container.addEventListener(
            'variantPriceChange',
            this.eventHandlers.updatePrice
        );
        this.container.addEventListener(
            'variantSKUChange',
            this.eventHandlers.updateSKU
        );
    }

    this._initMediaSwitch = function () {
        if (!document.querySelector(this.selectors.productThumbImages)) {
            return;
        }

        var self = this;

        var productThumbImages = document.querySelectorAll(
            this.selectors.productThumbImages
        );

        this.eventHandlers.handleMediaFocus = this._handleMediaFocus.bind(this);

        productThumbImages.forEach(function (el) {
            el.addEventListener('click', function (evt) {
                evt.preventDefault();
                var mediaId = el.getAttribute('data-thumbnail-id');

                self._switchMedia(mediaId);
                self._setActiveThumbnail(mediaId);
            });
            el.addEventListener('keyup', self.eventHandlers.handleMediaFocus);
        });
    }

    this._initAddToCart = function () {
        this.productForm.addEventListener(
            'submit',
            function (evt) {
                if (this.addToCart.getAttribute('aria-disabled') === 'true') {
                    evt.preventDefault();
                    return;
                }

                if (!this.ajaxEnabled) return;

                evt.preventDefault();

                this.previouslyFocusedElement = document.activeElement;

                var isInvalidQuantity =
                    !!this.quantityInput && this.quantityInput.value <= 0;

                if (isInvalidQuantity) {
                    this._showErrorMessage(theme.strings.quantityMinimumMessage);
                    return;
                }

                if (!isInvalidQuantity && this.ajaxEnabled) {
                    // disable the addToCart and dynamic checkout button while
                    // request/cart popup is loading and handle loading state
                    this._handleButtonLoadingState(true);
                    this._addItemToCart(this.productForm);
                    return;
                }
            }.bind(this)
        );
    }

    this._initProductVideo = function () {
        var sectionId = this.settings.sectionId;

        var productMediaTypeVideo = this.container.querySelectorAll(
            this.selectors.productMediaTypeVideo
        );
        productMediaTypeVideo.forEach(function (el) {
            theme.ProductVideo.init(el, sectionId);
        });
    }

    this._initModelViewerLibraries = function () {
        var modelViewerElements = this.container.querySelectorAll(
            this.selectors.productMediaTypeModel
        );
        if (modelViewerElements.length < 1) return;
        theme.ProductModel.init(modelViewerElements, this.settings.sectionId);
    }

    this._initShopifyXrLaunch = function () {
        this.eventHandlers.initShopifyXrLaunchHandler = this._initShopifyXrLaunchHandler.bind(
            this
        );
        document.addEventListener(
            'shopify_xr_launch',
            this.eventHandlers.initShopifyXrLaunchHandler
        );
    }

    this._initShopifyXrLaunchHandler = function () {
        var currentMedia = this.container.querySelector(
            this.selectors.productMediaWrapper +
            ':not(.' +
            self.classes.hidden +
            ')'
        );
        currentMedia.dispatchEvent(
            new CustomEvent('xrLaunch', {
                bubbles: true,
                cancelable: true
            })
        );
    }

    this._addItemToCart = function (form) {
        var self = this;

        fetch(this.cartRoutes.cartAddUrl + '.js', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: theme.Helpers.serialize(form)
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                if (json.status && json.status !== 200) {
                    var error = new Error(json.description);
                    error.isFromServer = true;
                    throw error;
                }
                self._hideErrorMessage();
                self._setupCartPopup(json);
            })
            .catch(function (error) {
                self.previouslyFocusedElement.focus();
                self._showErrorMessage(
                    error.isFromServer && error.message.length
                        ? error.message
                        : theme.strings.cartError
                );
                self._handleButtonLoadingState(false);
                // eslint-disable-next-line no-console
                console.log(error);
            });
    }

    this._handleButtonLoadingState = function (isLoading) {
        if (isLoading) {
            this.addToCart.setAttribute('aria-disabled', true);
            this.addToCartText.classList.add(this.classes.hidden);
            this.loader.classList.remove(this.classes.hidden);

            if (this.shopifyPaymentButton) {
                this.shopifyPaymentButton.setAttribute('disabled', true);
            }

            this.loaderStatus.setAttribute('aria-hidden', false);
        } else {
            this.addToCart.removeAttribute('aria-disabled');
            this.addToCartText.classList.remove(this.classes.hidden);
            this.loader.classList.add(this.classes.hidden);

            if (this.shopifyPaymentButton) {
                this.shopifyPaymentButton.removeAttribute('disabled');
            }

            this.loaderStatus.setAttribute('aria-hidden', true);
        }
    }

    this._showErrorMessage = function (errorMessage) {
        var errorMessageContainer = this.container.querySelector(
            this.selectors.errorMessage
        );
        errorMessageContainer.innerHTML = errorMessage;

        if (this.quantityInput) {
            this.quantityInput.classList.add(this.classes.inputError);
        }

        this.errorMessageWrapper.classList.remove(
            this.classes.productFormErrorMessageWrapperHidden
        );
        this.errorMessageWrapper.setAttribute('aria-hidden', true);
        this.errorMessageWrapper.removeAttribute('aria-hidden');
    }

    this._hideErrorMessage = function () {
        this.errorMessageWrapper.classList.add(
            this.classes.productFormErrorMessageWrapperHidden
        );

        if (this.quantityInput) {
            this.quantityInput.classList.remove(this.classes.inputError);
        }
    }

    this._setupCartPopup = function (item) {
        this.cartPopup =
            this.cartPopup || document.querySelector(this.selectors.cartPopup);
        this.cartPopupWrapper =
            this.cartPopupWrapper ||
            document.querySelector(this.selectors.cartPopupWrapper);
        this.cartPopupTitle =
            this.cartPopupTitle ||
            document.querySelector(this.selectors.cartPopupTitle);
        this.cartPopupQuantity =
            this.cartPopupQuantity ||
            document.querySelector(this.selectors.cartPopupQuantity);
        this.cartPopupQuantityLabel =
            this.cartPopupQuantityLabel ||
            document.querySelector(this.selectors.cartPopupQuantityLabel);
        this.cartPopupClose =
            this.cartPopupClose ||
            document.querySelector(this.selectors.cartPopupClose);
        this.cartPopupDismiss =
            this.cartPopupDismiss ||
            document.querySelector(this.selectors.cartPopupDismiss);
        this.cartPopupImagePlaceholder =
            this.cartPopupImagePlaceholder ||
            document.querySelector(this.selectors.cartPopupImagePlaceholder);

        this._setupCartPopupEventListeners();

        this._updateCartPopupContent(item);
    }

    this._updateCartPopupContent = function (item) {
        var self = this;

        var quantity = this.quantityInput ? this.quantityInput.value : 1;

        var selling_plan_name = item.selling_plan_allocation
            ? item.selling_plan_allocation.selling_plan.name
            : null;

        this.cartPopupTitle.textContent = item.product_title;
        this.cartPopupQuantity.textContent = quantity;
        this.cartPopupQuantityLabel.textContent = theme.strings.quantityLabel.replace(
            '[count]',
            quantity
        );

        this._setCartPopupPlaceholder(item.featured_image.url);
        this._setCartPopupImage(item.featured_image.url, item.featured_image.alt);
        this._setCartPopupProductDetails(
            item.product_has_only_default_variant,
            item.options_with_values,
            item.properties,
            selling_plan_name
        );

        fetch(this.cartRoutes.cartUrl + '.js', {credentials: 'same-origin'})
            .then(function (response) {
                return response.json();
            })
            .then(function (cart) {
                self._setCartQuantity(cart.item_count);
                self._setCartCountBubble(cart.item_count);
                self._showCartPopup();
            })
            .catch(function (error) {
                // eslint-disable-next-line no-console
                console.log(error);
            });
    }

    this._setupCartPopupEventListeners = function () {
        this.eventHandlers.cartPopupWrapperKeyupHandler = this._cartPopupWrapperKeyupHandler.bind(
            this
        );
        this.eventHandlers.hideCartPopup = this._hideCartPopup.bind(this);
        this.eventHandlers.onBodyClick = this._onBodyClick.bind(this);

        this.cartPopupWrapper.addEventListener(
            'keyup',
            this.eventHandlers.cartPopupWrapperKeyupHandler
        );
        this.cartPopupClose.addEventListener(
            'click',
            this.eventHandlers.hideCartPopup
        );
        this.cartPopupDismiss.addEventListener(
            'click',
            this.eventHandlers.hideCartPopup
        );
        document.body.addEventListener('click', this.eventHandlers.onBodyClick);
    }

    this._cartPopupWrapperKeyupHandler = function (event) {
        if (event.keyCode === slate.utils.keyboardKeys.ESCAPE) {
            this._hideCartPopup(event);
        }
    }

    this._setCartPopupPlaceholder = function (imageUrl) {
        this.cartPopupImageWrapper =
            this.cartPopupImageWrapper ||
            document.querySelector(this.selectors.cartPopupImageWrapper);

        if (imageUrl === null) {
            this.cartPopupImageWrapper.classList.add(this.classes.hidden);
            return;
        }
    }

    this._setCartPopupImage = function (imageUrl, imageAlt) {
        if (imageUrl === null) return;

        this.cartPopupImageWrapper.classList.remove(this.classes.hidden);
        var sizedImageUrl = theme.Images.getSizedImageUrl(imageUrl, '200x');
        var image = document.createElement('img');
        image.src = sizedImageUrl;
        image.alt = imageAlt;
        image.classList.add(this.classes.cartImage);
        image.setAttribute('data-cart-popup-image', '');

        image.onload = function () {
            this.cartPopupImagePlaceholder.removeAttribute(
                'data-image-loading-animation'
            );
            this.cartPopupImageWrapper.append(image);
        }.bind(this);
    }

    this._setCartPopupProductDetails = function (
        product_has_only_default_variant,
        options,
        properties,
        selling_plan_name
    ) {
        this.cartPopupProductDetails =
            this.cartPopupProductDetails ||
            document.querySelector(this.selectors.cartPopupProductDetails);
        var variantPropertiesHTML = '';

        if (!product_has_only_default_variant) {
            variantPropertiesHTML =
                variantPropertiesHTML + this._getVariantOptionList(options);
        }

        if (selling_plan_name) {
            variantPropertiesHTML =
                variantPropertiesHTML + this._getSellingPlanHTML(selling_plan_name);
        }

        if (properties !== null && Object.keys(properties).length !== 0) {
            variantPropertiesHTML =
                variantPropertiesHTML + this._getPropertyList(properties);
        }

        if (variantPropertiesHTML.length === 0) {
            this.cartPopupProductDetails.innerHTML = '';
            this.cartPopupProductDetails.setAttribute('hidden', '');
        } else {
            this.cartPopupProductDetails.innerHTML = variantPropertiesHTML;
            this.cartPopupProductDetails.removeAttribute('hidden');
        }
    }

    this._getVariantOptionList = function (variantOptions) {
        var variantOptionListHTML = '';

        variantOptions.forEach(function (variantOption) {
            variantOptionListHTML =
                variantOptionListHTML +
                '<li class="product-details__item product-details__item--variant-option">' +
                variantOption.name +
                ': ' +
                variantOption.value +
                '</li>';
        });

        return variantOptionListHTML;
    }

    this._getPropertyList = function (properties) {
        var propertyListHTML = '';
        var propertiesArray = Object.entries(properties);

        propertiesArray.forEach(function (property) {
            // Line item properties prefixed with an underscore are not to be displayed
            if (property[0].charAt(0) === '_') return;

            // if the property value has a length of 0 (empty), don't display it
            if (property[1].length === 0) return;

            propertyListHTML =
                propertyListHTML +
                '<li class="product-details__item product-details__item--property">' +
                '<span class="product-details__property-label">' +
                property[0] +
                ': </span>' +
                property[1];
            ': ' + '</li>';
        });

        return propertyListHTML;
    }

    this._getSellingPlanHTML = function (selling_plan_name) {
        var sellingPlanHTML =
            '<li class="product-details__item product-details__item--property">' +
            selling_plan_name +
            '</li>';

        return sellingPlanHTML;
    }

    this._setCartQuantity = function (quantity) {
        this.cartPopupCartQuantity =
            this.cartPopupCartQuantity ||
            document.querySelector(this.selectors.cartPopupCartQuantity);
        var ariaLabel;

        if (quantity === 1) {
            ariaLabel = theme.strings.oneCartCount;
        } else if (quantity > 1) {
            ariaLabel = theme.strings.otherCartCount.replace('[count]', quantity);
        }

        this.cartPopupCartQuantity.textContent = quantity;
        this.cartPopupCartQuantity.setAttribute('aria-label', ariaLabel);
    }

    this._setCartCountBubble = function (quantity) {
        this.cartCountBubble =
            this.cartCountBubble ||
            document.querySelector(this.selectors.cartCountBubble);
        this.cartCount =
            this.cartCount || document.querySelector(this.selectors.cartCount);

        this.cartCountBubble.classList.remove(this.classes.hidden);
        this.cartCount.textContent = quantity;
    }

    this._showCartPopup = function () {
        theme.Helpers.prepareTransition(this.cartPopupWrapper);

        this.cartPopupWrapper.classList.remove(
            this.classes.cartPopupWrapperHidden
        );
        this._handleButtonLoadingState(false);

        slate.a11y.trapFocus({
            container: this.cartPopupWrapper,
            elementToFocus: this.cartPopup,
            namespace: 'cartPopupFocus'
        });
    }

    this._hideCartPopup = function (event) {
        var setFocus = event.detail === 0 ? true : false;
        theme.Helpers.prepareTransition(this.cartPopupWrapper);
        this.cartPopupWrapper.classList.add(this.classes.cartPopupWrapperHidden);

        var cartPopupImage = document.querySelector(
            this.selectors.cartPopupImage
        );
        if (cartPopupImage) {
            cartPopupImage.remove();
        }
        this.cartPopupImagePlaceholder.setAttribute(
            'data-image-loading-animation',
            ''
        );

        slate.a11y.removeTrapFocus({
            container: this.cartPopupWrapper,
            namespace: 'cartPopupFocus'
        });

        if (setFocus) this.previouslyFocusedElement.focus();

        this.cartPopupWrapper.removeEventListener(
            'keyup',
            this.eventHandlers.cartPopupWrapperKeyupHandler
        );
        this.cartPopupClose.removeEventListener(
            'click',
            this.eventHandlers.hideCartPopup
        );
        this.cartPopupDismiss.removeEventListener(
            'click',
            this.eventHandlers.hideCartPopup
        );
        document.body.removeEventListener(
            'click',
            this.eventHandlers.onBodyClick
        );
    }

    this._onBodyClick = function (event) {
        var target = event.target;

        if (
            target !== this.cartPopupWrapper &&
            !target.closest(this.selectors.cartPopup)
        ) {
            this._hideCartPopup(event);
        }
    }

    this._setActiveThumbnail = function (mediaId) {
        // If there is no element passed, find it by the current product image
        if (typeof mediaId === 'undefined') {
            var productMediaWrapper = this.container.querySelector(
                this.selectors.productMediaWrapper + ':not(.hide)'
            );

            if (!productMediaWrapper) return;
            mediaId = productMediaWrapper.getAttribute('data-media-id');
        }

        var thumbnailWrappers = this.container.querySelectorAll(
            this.selectors.productThumbListItem + ':not(.slick-cloned)'
        );

        var activeThumbnail;
        thumbnailWrappers.forEach(
            function (el) {
                var current = el.querySelector(
                    this.selectors.productThumbImages +
                    "[data-thumbnail-id='" +
                    mediaId +
                    "']"
                );
                if (current) {
                    activeThumbnail = current;
                }
            }.bind(this)
        );

        var productThumbImages = document.querySelectorAll(
            this.selectors.productThumbImages
        );
        productThumbImages.forEach(
            function (el) {
                el.classList.remove(this.classes.activeClass);
                el.removeAttribute('aria-current');
            }.bind(this)
        );

        if (activeThumbnail) {
            activeThumbnail.classList.add(this.classes.activeClass);
            activeThumbnail.setAttribute('aria-current', true);
            this._adjustThumbnailSlider(activeThumbnail);
        }
    }

    this._adjustThumbnailSlider = function (activeThumbnail) {
        var sliderItem = activeThumbnail.closest('[data-slider-item]');
        if (!sliderItem) return;

        var slideGroupLeaderIndex =
            Math.floor(
                Number(sliderItem.getAttribute('data-slider-slide-index')) / 3
            ) * 3;

        window.setTimeout(
            function () {
                if (!this.slideshow) return;
                this.slideshow.goToSlideByIndex(slideGroupLeaderIndex);
            }.bind(this),
            251
        );
    }

    this.switchMedia = function (mediaId) {
        var currentMedia = this.container.querySelector(
            this.selectors.productMediaWrapper +
            ':not(.' +
            this.classes.hidden +
            ')'
        );

        var newMedia = this.container.querySelector(
            this.selectors.productMediaWrapper + "[data-media-id='" + mediaId + "']"
        );

        var otherMedia = this.container.querySelectorAll(
            this.selectors.productMediaWrapper +
            ":not([data-media-id='" +
            mediaId +
            "'])"
        );

        currentMedia.dispatchEvent(
            new CustomEvent('mediaHidden', {
                bubbles: true,
                cancelable: true
            })
        );
        newMedia.classList.remove(this.classes.hidden);
        newMedia.dispatchEvent(
            new CustomEvent('mediaVisible', {
                bubbles: true,
                cancelable: true
            })
        );
        otherMedia.forEach(
            function (el) {
                el.classList.add(this.classes.hidden);
            }.bind(this)
        );
    }

    this._handleMediaFocus = function (evt) {
        if (evt.keyCode !== slate.utils.keyboardKeys.ENTER) return;

        var mediaId = evt.currentTarget.getAttribute('data-thumbnail-id');

        var productMediaWrapper = this.container.querySelector(
            this.selectors.productMediaWrapper + "[data-media-id='" + mediaId + "']"
        );
        productMediaWrapper.focus();
    }

    this._initThumbnailSlider = function () {
        setTimeout(
            function () {
                this.slideshow = new theme.Slideshow(
                    this.container.querySelector('[data-thumbnail-slider]'),
                    {
                        canUseTouchEvents: true,
                        type: 'slide',
                        slideActiveClass: 'slick-active',
                        slidesToShow: 3,
                        slidesToScroll: 3
                    }
                );

                this.settings.sliderActive = true;
            }.bind(this),
            250
        );
    }

    this._destroyThumbnailSlider = function () {
        var sliderButtons = this.container.querySelectorAll(
            '[data-slider-button]'
        );
        var sliderTrack = this.container.querySelector('[data-slider-track]');
        var sliderItems = sliderTrack.querySelectorAll('[data-slider-item');
        this.settings.sliderActive = false;

        if (sliderTrack) {
            sliderTrack.removeAttribute('style');
            sliderItems.forEach(function (sliderItem) {
                var sliderItemLink = sliderItem.querySelector(
                    '[data-slider-item-link]'
                );
                sliderItem.classList.remove('slick-active');
                sliderItem.removeAttribute('style');
                sliderItem.removeAttribute('tabindex');
                sliderItem.removeAttribute('aria-hidden');
                sliderItemLink.removeAttribute('tabindex');
            });
        }

        sliderButtons.forEach(function (sliderButton) {
            sliderButton.removeAttribute('aria-disabled');
        });

        this.slideshow.destroy();
        this.slideshow = null;
    }

    this._liveRegionText = function (variant) {
        // Dummy content for live region
        var liveRegionText =
            '[Availability] [Regular] [$$] [Sale] [$]. [UnitPrice] [$$$]';

        if (!this.productState.available) {
            liveRegionText = theme.strings.unavailable;
            return liveRegionText;
        }

        // Update availability
        var availability = this.productState.soldOut
            ? theme.strings.soldOut + ','
            : '';
        liveRegionText = liveRegionText.replace('[Availability]', availability);

        // Update pricing information
        var regularLabel = '';
        var regularPrice = theme.Currency.formatMoney(
            variant.price,
            theme.moneyFormat
        );
        var saleLabel = '';
        var salePrice = '';
        var unitLabel = '';
        var unitPrice = '';

        if (this.productState.onSale) {
            regularLabel = theme.strings.regularPrice;
            regularPrice =
                theme.Currency.formatMoney(
                    variant.compare_at_price,
                    theme.moneyFormat
                ) + ',';
            saleLabel = theme.strings.sale;
            salePrice = theme.Currency.formatMoney(
                variant.price,
                theme.moneyFormat
            );
        }

        if (this.productState.showUnitPrice) {
            unitLabel = theme.strings.unitPrice;
            unitPrice =
                theme.Currency.formatMoney(variant.unit_price, theme.moneyFormat) +
                ' ' +
                theme.strings.unitPriceSeparator +
                ' ' +
                this._getBaseUnit(variant);
        }

        liveRegionText = liveRegionText
            .replace('[Regular]', regularLabel)
            .replace('[$$]', regularPrice)
            .replace('[Sale]', saleLabel)
            .replace('[$]', salePrice)
            .replace('[UnitPrice]', unitLabel)
            .replace('[$$$]', unitPrice)
            .trim();

        return liveRegionText;
    }

    this._updateLiveRegion = function (evt) {
        var variant = evt.detail.variant;
        var liveRegion = this.container.querySelector(
            this.selectors.productStatus
        );
        liveRegion.innerHTML = this._liveRegionText(variant);
        liveRegion.setAttribute('aria-hidden', false);
        // hide content from accessibility tree after announcement
        setTimeout(function () {
            liveRegion.setAttribute('aria-hidden', true);
        }, 1000);
    }

    this._enableAddToCart = function (message) {
        this.addToCart.removeAttribute('aria-disabled');
        this.addToCart.setAttribute('aria-label', message);
        this.addToCartText.innerHTML = message;
        this.productForm.classList.remove(this.classes.variantSoldOut);
    }

    this._disableAddToCart = function (message) {
        message = message || theme.strings.unavailable;
        this.addToCart.setAttribute('aria-disabled', true);
        this.addToCart.setAttribute('aria-label', message);
        this.addToCartText.innerHTML = message;
        this.productForm.classList.add(this.classes.variantSoldOut);
    }

    this._updateAddToCart = function () {
        if (!this.productState.available) {
            this._disableAddToCart(theme.strings.unavailable);
            return;
        }
        if (this.productState.soldOut) {
            this._disableAddToCart(theme.strings.soldOut);
            return;
        }

        this._enableAddToCart(theme.strings.addToCart);
    }

    /**
     * The returned productState object keeps track of a number of properties about the current variant and product
     * Multiple functions within product.js leverage the productState object to determine how to update the page's UI
     * @param {object} evt - object returned from variant change event
     * @return {object} productState - current product variant's state
     *                  productState.available - true if current product options result in valid variant
     *                  productState.soldOut - true if variant is sold out
     *                  productState.onSale - true if variant is on sale
     *                  productState.showUnitPrice - true if variant has unit price value
     */
    this._setProductState = function (evt) {
        var variant = evt.detail.variant;

        if (!variant) {
            this.productState.available = false;
            return;
        }

        this.productState.available = true;
        this.productState.soldOut = !variant.available;
        this.productState.onSale = variant.compare_at_price > variant.price;
        this.productState.showUnitPrice = !!variant.unit_price;
    }

    this._updateAvailability = function (evt) {
        // remove error message if one is showing
        this._hideErrorMessage();

        // set product state
        this._setProductState(evt);

        // update store availabilities info
        this._updateStoreAvailabilityContent(evt);
        // update form submit
        this._updateAddToCart();
        // update live region
        this._updateLiveRegion(evt);

        this._updatePriceComponentStyles(evt);
    }

    this._updateStoreAvailabilityContent = function (evt) {
        if (!this.storeAvailability) {
            return;
        }

        if (this.productState.available && !this.productState.soldOut) {
            this.storeAvailability.updateContent(evt.detail.variant.id);
        } else {
            this.storeAvailability.clearContent();
        }
    }

    this._updateMedia = function (evt) {
        var variant = evt.detail.variant;
        var mediaId = variant.featured_media.id;
        var sectionMediaId = this.settings.sectionId + '-' + mediaId;

        this._switchMedia(sectionMediaId);
        this._setActiveThumbnail(sectionMediaId);
    }

    this._hidePriceComponent = function () {
        this.priceContainer.classList.add(this.classes.productUnavailable);
        this.priceContainer.setAttribute('aria-hidden', true);
        if (this.productPolicies) {
            this.productPolicies.classList.add(this.classes.visibilityHidden);
        }
    }

    this._updatePriceComponentStyles = function (evt) {
        var variant = evt.detail.variant;

        var unitPriceBaseUnit = this.priceContainer.querySelector(
            this.selectors.unitPriceBaseUnit
        );

        if (!this.productState.available) {
            this._hidePriceComponent();
            return;
        }

        if (this.productState.soldOut) {
            this.priceContainer.classList.add(this.classes.productSoldOut);
        } else {
            this.priceContainer.classList.remove(this.classes.productSoldOut);
        }

        if (this.productState.showUnitPrice) {
            unitPriceBaseUnit.innerHTML = this._getBaseUnit(variant);
            this.priceContainer.classList.add(this.classes.productUnitAvailable);
        } else {
            this.priceContainer.classList.remove(this.classes.productUnitAvailable);
        }

        if (this.productState.onSale) {
            this.priceContainer.classList.add(this.classes.productOnSale);
        } else {
            this.priceContainer.classList.remove(this.classes.productOnSale);
        }

        this.priceContainer.classList.remove(this.classes.productUnavailable);
        this.priceContainer.removeAttribute('aria-hidden');
        if (this.productPolicies) {
            this.productPolicies.classList.remove(this.classes.visibilityHidden);
        }
    }

    this._updatePrice = function (evt) {
        var variant = evt.detail.variant;

        var regularPrices = this.priceContainer.querySelectorAll(
            this.selectors.regularPrice
        );
        var salePrice = this.priceContainer.querySelector(
            this.selectors.salePrice
        );
        var unitPrice = this.priceContainer.querySelector(
            this.selectors.unitPrice
        );

        var formatRegularPrice = function (regularPriceElement, price) {
            regularPriceElement.innerHTML = theme.Currency.formatMoney(
                price,
                theme.moneyFormat
            );
        };

        // On sale
        if (this.productState.onSale) {
            regularPrices.forEach(function (regularPrice) {
                formatRegularPrice(regularPrice, variant.compare_at_price);
            });
            salePrice.innerHTML = theme.Currency.formatMoney(
                variant.price,
                theme.moneyFormat
            );
        } else {
            // Regular price
            regularPrices.forEach(function (regularPrice) {
                formatRegularPrice(regularPrice, variant.price);
            });
        }

        // Unit price
        if (this.productState.showUnitPrice) {
            unitPrice.innerHTML = theme.Currency.formatMoney(
                variant.unit_price,
                theme.moneyFormat
            );
        }
    }

    this._getBaseUnit = function (variant) {
        return variant.unit_price_measurement.reference_value === 1
            ? variant.unit_price_measurement.reference_unit
            : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }

    this._updateSKU = function (evt) {
        var variant = evt.detail.variant;

        // Update the sku
        var sku = document.querySelector(this.selectors.SKU);
        if (!sku) return;
        sku.innerHTML = variant.sku;
    }

    this._enableZoom = function (el, index) {
        this.zoomPictures[index] = new theme.Zoom(el);
    }

    this._destroyZoom = function (index) {
        if (this.zoomPictures.length === 0) return;
        this.zoomPictures[index].unload();
    }

    this.onUnload = function () {
        this.container.removeEventListener(
            'variantChange',
            this.eventHandlers.updateAvailability
        );
        this.container.removeEventListener(
            'variantImageChange',
            this.eventHandlers.updateMedia
        );
        this.container.removeEventListener(
            'variantPriceChange',
            this.eventHandlers.updatePrice
        );
        this.container.removeEventListener(
            'variantSKUChange',
            this.eventHandlers.updateSKU
        );
        theme.ProductVideo.removeSectionVideos(this.settings.sectionId);
        theme.ProductModel.removeSectionModels(this.settings.sectionId);

        if (this.mqlSmall) {
            this.mqlSmall.removeListener(this.initMobileBreakpoint);
        }

        if (this.mqlMediumUp) {
            this.mqlMediumUp.removeListener(this.initDesktopBreakpoint);
        }
    }
}

export default Product;