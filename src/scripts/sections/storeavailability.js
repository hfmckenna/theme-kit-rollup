const StoreAvailability = (function () {
        function StoreAvailability(container) {
            this.container = container;

            var selectors = {
                storeAvailabilityModalOpen: '[data-store-availability-modal-open]',
                storeAvailabilityModalProductTitle:
                    '[data-store-availability-modal-product-title]',
                storeAvailabilityModalVariantTitle:
                    '[data-store-availability-modal-variant-title]'
            };

            var classes = {
                hidden: 'hide'
            };

            this.onLoad = function () {
                this.productTitle = this.container.dataset.productTitle;
                this.hasOnlyDefaultVariant =
                this.container.dataset.hasOnlyDefaultVariant === 'true';
            }

            this.updateContent = function (variantId) {
                var variantSectionUrl =
                    this.container.dataset.baseUrl +
                    '/variants/' +
                    variantId +
                    '/?section_id=store-availability';
                var self = this;

                var storeAvailabilityModalOpen = self.container.querySelector(
                    selectors.storeAvailabilityModalOpen
                );

                this.container.style.opacity = 0.5;
                if (storeAvailabilityModalOpen) {
                    storeAvailabilityModalOpen.disabled = true;
                    storeAvailabilityModalOpen.setAttribute('aria-busy', true);
                }

                fetch(variantSectionUrl)
                    .then(function (response) {
                        return response.text();
                    })
                    .then(function (storeAvailabilityHTML) {
                        if (storeAvailabilityHTML.trim() === '') {
                            return;
                        }
                        self.container.innerHTML = storeAvailabilityHTML;
                        self.container.innerHTML = self.container.firstElementChild.innerHTML;
                        self.container.style.opacity = 1;

                        // Need to query this again because we updated the DOM
                        storeAvailabilityModalOpen = self.container.querySelector(
                            selectors.storeAvailabilityModalOpen
                        );

                        if (!storeAvailabilityModalOpen) {
                            return;
                        }

                        storeAvailabilityModalOpen.addEventListener(
                            'click',
                            self._onClickModalOpen.bind(self)
                        );

                        self.modal = self._initModal();
                        self._updateProductTitle();
                        if (self.hasOnlyDefaultVariant) {
                            self._hideVariantTitle();
                        }
                    });
            }

            this.clearContent = function () {
                this.container.innerHTML = '';
            }

            this._onClickModalOpen = function () {
                this.container.dispatchEvent(
                    new CustomEvent('storeAvailabilityModalOpened', {
                        bubbles: true,
                        cancelable: true
                    })
                );
            }

            this._initModal = function () {
                return new window.Modals(
                    'StoreAvailabilityModal',
                    'store-availability-modal',
                    {
                        close: '.js-modal-close-store-availability-modal',
                        closeModalOnClick: true,
                        openClass: 'store-availabilities-modal--active'
                    }
                );
            }

            this._updateProductTitle = function () {
                var storeAvailabilityModalProductTitle = this.container.querySelector(
                    selectors.storeAvailabilityModalProductTitle
                );
                storeAvailabilityModalProductTitle.textContent = this.productTitle;
            }

            this._hideVariantTitle = function () {
                var storeAvailabilityModalVariantTitle = this.container.querySelector(
                    selectors.storeAvailabilityModalVariantTitle
                );
                storeAvailabilityModalVariantTitle.classList.add(classes.hidden);
            }

        }
        return StoreAvailability;
    }
)();

export default StoreAvailability;