import Helpers from "../helpers/helpers";

const Slideshow = (function () {
    var selectors = {
        button: '[data-slider-button]',
        indicator: '[data-slider-indicator]',
        indicators: '[data-slider-indicators]',
        pause: '[data-slider-pause]',
        slider: '[data-slider]',
        sliderItem: '[data-slider-item]',
        sliderItemLink: '[data-slider-item-link]',
        sliderTrack: '[data-slider-track]',
        sliderContainer: '[data-slider-container]'
    };

    var classes = {
        isPaused: 'slideshow__pause--is-paused',
        indicator: 'slider-indicators__item',
        indicatorActive: 'slick-active',
        sliderInitialized: 'slick-initialized',
        slideActive: 'slideshow__slide--active',
        slideClone: 'slick-cloned'
    };

    var attributes = {
        buttonNext: 'data-slider-button-next'
    };

    function Slideshow(container, options) {
        this.container = container;
        this.slider = this.container.querySelector(selectors.slider);

        if (!this.slider) return;

        this.eventHandlers = {};
        this.lastSlide = 0;
        this.slideIndex = 0;
        this.sliderContainer = null;
        this.slides = [];
        this.options = Object.assign(
            {},
            {
                autoplay: false,
                canUseKeyboardArrows: true,
                canUseTouchEvents: false,
                slideActiveClass: classes.slideActive,
                slideInterval: 0,
                slidesToShow: 0,
                slidesToScroll: 1,
                type: 'fade'
            },
            options
        );

        this.sliderContainer = this.slider.querySelector(selectors.sliderContainer);
        this.adaptHeight =
            this.sliderContainer.getAttribute('data-adapt-height') === 'true';
        this.slides = Array.from(
            this.sliderContainer.querySelectorAll(selectors.sliderItem)
        );
        // adding -1 to accomodate Array order
        this.lastSlide = this.slides.length - 1;
        this.buttons = this.container.querySelectorAll(selectors.button);
        this.pause = this.container.querySelector(selectors.pause);
        this.indicators = this.container.querySelectorAll(selectors.indicators);

        if (this.slides.length <= 1) return;

        this.timeout = 250;

        if (this.options.autoplay) {
            this.startAutoplay();
        }

        if (this.adaptHeight) {
            this.setSlideshowHeight();
        }

        if (this.options.type === 'slide') {
            this.isFirstSlide = false;
            this.isLastSlide = false;
            this.sliderItemWidthTotal = 0;
            this.sliderTrack = this.slider.querySelector(selectors.sliderTrack);
            // added setTimeout due to matchMedia calling too early
            // which result wrong value when getting dimension from an element
            this.sliderItemWidthTotal = 0;
            Helpers.promiseStylesheet().then(
                function () {
                    this._setupSlideType();
                }.bind(this)
            );
        } else {
            this.setupSlider(0);
        }

        this._setupEventHandlers();
    }

    Slideshow.prototype = Object.assign({}, Slideshow.prototype, {
        /**
         * Moves to the previous slide
         */
        previousSlide: function () {
            this._move();
        },

        /**
         * Moves to the next slide
         */
        nextSlide: function () {
            this._move('next');
        },

        /**
         * Moves to the specified slide
         * @param {Number} index - The index of the slide to move to
         */
        setSlide: function (index) {
            this._setPosition(Number(index));
        },

        /**
         * Starts autoplaying the slider if autoplay is enabled
         */
        startAutoplay: function () {
            this.isAutoPlaying = true;

            window.clearTimeout(this.autoTimeOut);

            this.autoTimeOut = window.setTimeout(
                function () {
                    var nextSlideIndex = this._getNextSlideIndex('next');
                    this._setPosition(nextSlideIndex);
                }.bind(this),
                this.options.slideInterval
            );
        },

        /**
         * Stops autoplaying the slider if autoplay is enabled
         */
        stopAutoplay: function () {
            this.isAutoPlaying = false;

            window.clearTimeout(this.autoTimeOut);
        },

        /**
         * Set active states for sliders and indicators
         * @param {index} integer - Slide index to set up slider from
         */
        setupSlider: function (index) {
            this.slideIndex = index;

            if (this.indicators.length) {
                this._setActiveIndicator(index);
            }

            this._setupActiveSlide(index);
        },

        /**
         * Removes event listeners, among other things when wanting to destroy the
         * slider instance. This method needs to be called manually and will most
         * likely be included in a section's onUnload() method.
         */
        destroy: function () {
            if (this.adaptHeight) {
                window.removeEventListener('resize', this.eventHandlers.debounceResize);
            }

            this.container.removeEventListener(
                'focus',
                this.eventHandlers.focus,
                true
            );
            this.slider.removeEventListener(
                'focusin',
                this.eventHandlers.focusIn,
                true
            );
            this.slider.removeEventListener(
                'focusout',
                this.eventHandlers.focusOut,
                true
            );
            this.container.removeEventListener('blur', this.eventHandlers.blur, true);

            if (this.buttons) {
                this.buttons.forEach(
                    function (button) {
                        button.removeEventListener('click', this.eventHandlers.clickButton);
                    }.bind(this)
                );
            }

            this.indicators.forEach(function (indicatorWrapper) {
                indicatorWrapper.childNodes.forEach(function (indicator) {
                    indicator.firstElementChild.removeEventListener(
                        'click',
                        this.eventHandlers.onClickIndicator
                    );

                    indicator.firstElementChild.removeEventListener(
                        'keydown',
                        this.eventHandlers.onKeydownIndicator
                    );
                }, this);
            }, this);

            if (this.options.type === 'slide') {
                window.removeEventListener(
                    'resize',
                    this.eventHandlers.debounceResizeSlideIn
                );

                if (this.touchEvents && this.options.canUseTouchEvents) {
                    this.touchEvents.destroy();
                    this.touchEvents = null;
                }
            }
        },

        _setupEventHandlers: function () {
            this.eventHandlers.focus = this._onFocus.bind(this);
            this.eventHandlers.focusIn = this._onFocusIn.bind(this);
            this.eventHandlers.focusOut = this._onFocusOut.bind(this);
            this.eventHandlers.blur = this._onBlur.bind(this);
            this.eventHandlers.keyUp = this._onKeyUp.bind(this);
            this.eventHandlers.clickButton = this._onClickButton.bind(this);
            this.eventHandlers.onClickIndicator = this._onClickIndicator.bind(this);
            this.eventHandlers.onKeydownIndicator = this._onKeydownIndicator.bind(
                this
            );
            this.eventHandlers.onClickPause = this._onClickPause.bind(this);

            if (this.adaptHeight) {
                this.eventHandlers.debounceResize = Helpers.debounce(
                    function () {
                        this.setSlideshowHeight();
                    }.bind(this),
                    50
                );

                window.addEventListener('resize', this.eventHandlers.debounceResize);
            }

            this.container.addEventListener('focus', this.eventHandlers.focus, true);
            this.slider.addEventListener('focusin', this.eventHandlers.focusIn, true);
            this.slider.addEventListener(
                'focusout',
                this.eventHandlers.focusOut,
                true
            );
            this.container.addEventListener('blur', this.eventHandlers.blur, true);

            if (this.buttons) {
                this.buttons.forEach(
                    function (button) {
                        button.addEventListener('click', this.eventHandlers.clickButton);
                    }.bind(this)
                );
            }

            if (this.pause) {
                this.pause.addEventListener('click', this.eventHandlers.onClickPause);
            }

            this.indicators.forEach(function (indicatorWrapper) {
                indicatorWrapper.childNodes.forEach(function (indicator) {
                    indicator.firstElementChild.addEventListener(
                        'click',
                        this.eventHandlers.onClickIndicator
                    );

                    indicator.firstElementChild.addEventListener(
                        'keydown',
                        this.eventHandlers.onKeydownIndicator
                    );
                }, this);
            }, this);

            if (this.options.type === 'slide') {
                this.eventHandlers.debounceResizeSlideIn = Helpers.debounce(
                    function () {
                        this.sliderItemWidthTotal = 0;
                        this._setupSlideType(true);
                    }.bind(this),
                    50
                );

                window.addEventListener(
                    'resize',
                    this.eventHandlers.debounceResizeSlideIn
                );

                if (
                    this.options.canUseTouchEvents &&
                    this.options.slidesToScroll < this.slides.length
                ) {
                    this._setupTouchEvents();
                }
            }
        },

        _setupTouchEvents: function () {
            this.touchEvents = new theme.TouchEvents(this.sliderTrack, {
                start: function () {
                    this._onTouchStart();
                }.bind(this),
                move: function (event, direction, difference) {
                    this._onTouchMove(event, direction, difference);
                }.bind(this),
                end: function (event, direction, difference) {
                    this._onTouchEnd(event, direction, difference);
                }.bind(this)
            });
        },

        /**
         * Set slideshop for "slide-in" effect
         * @param {Boolean} onResize if function call came from resize event
         */
        _setupSlideType: function (onResize) {
            this.sliderItemWidth = Math.floor(
                this.sliderContainer.offsetWidth / this.options.slidesToShow
            );
            this.sliderTranslateXMove =
                this.sliderItemWidth * this.options.slidesToScroll;

            if (!onResize) {
                this.sliderContainer.classList.add(classes.sliderInitialized);
            }

            // Loop through all slider items
            // Set width according to the number of items to show in 1 slide
            // Set container width to accomodate all items
            this.slides.forEach(function (sliderItem, index) {
                var sliderItemLink = sliderItem.querySelector(selectors.sliderItemLink);
                sliderItem.style.width = this.sliderItemWidth + 'px';
                sliderItem.setAttribute('aria-hidden', true);
                sliderItem.setAttribute('tabindex', -1);
                this.sliderItemWidthTotal =
                    this.sliderItemWidthTotal + sliderItem.offsetWidth;

                if (sliderItemLink) {
                    sliderItemLink.setAttribute('tabindex', -1);
                }

                if (index < this.options.slidesToShow) {
                    sliderItem.setAttribute('aria-hidden', false);
                    sliderItem.classList.add(this.options.slideActiveClass);

                    if (sliderItemLink) {
                        sliderItemLink.setAttribute('tabindex', 0);
                    }
                }
            }, this);

            this.sliderTrack.style.width =
                Math.floor(this.sliderItemWidthTotal) + 'px';
            this.sliderTrack.style.transform = 'translateX(-0px)';

            // set disabled attribute on Previous button
            if (this.buttons.length) {
                this.buttons[0].setAttribute('aria-disabled', true);
                this.buttons[1].removeAttribute('aria-disabled');
            }

            if (this.indicators.length) {
                this._setActiveIndicator(0);
            }
        },

        _onTouchStart: function () {
            this.touchStartPosition = this._getTranslateXPosition();
        },

        _onTouchMove: function (event, direction, difference) {
            // Fix touch events cause unexpected behaviour
            // when the dragging motion goes beyond the theme editor preview.
            var threshold = 80;
            if (
                Shopify.designMode &&
                (event.clientX <= threshold ||
                    event.clientX >= window.innerWidth - threshold)
            ) {
                event.target.dispatchEvent(
                    new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true
                    })
                );
                return;
            }

            if (direction !== 'left' && direction !== 'right') return;

            this.touchMovePosition = this.touchStartPosition + difference.xPosition;

            this.sliderTrack.style.transform =
                'translateX(' + this.touchMovePosition + 'px';
        },

        _onTouchEnd: function (event, direction, difference) {
            var nextTranslateXPosition = 0;

            if (Object.keys(difference).length === 0) return;

            var slideDirection = direction === 'left' ? 'next' : '';

            if (direction === 'left') {
                if (this._isNextTranslateXLast(this.touchStartPosition)) {
                    nextTranslateXPosition = this.touchStartPosition;
                } else {
                    nextTranslateXPosition =
                        this.touchStartPosition - this.sliderTranslateXMove;
                }
            } else {
                nextTranslateXPosition =
                    this.touchStartPosition + this.sliderTranslateXMove;
                if (this._isNextTranslateXFirst(this.touchStartPosition)) {
                    nextTranslateXPosition = 0;
                }
            }

            this.slideIndex = this._getNextSlideIndex(slideDirection);

            this.sliderTrack.style.transition = 'transform 500ms ease 0s';
            this.sliderTrack.style.transform =
                'translateX(' + nextTranslateXPosition + 'px';

            window.setTimeout(
                function () {
                    this.sliderTrack.style.transition = '';
                }.bind(this),
                500
            );

            this._verifyFirstLastSlideTranslateX(nextTranslateXPosition);

            this._postTransitionEnd();
        },

        /**
         * Events handlers for next and previous button
         * @param {Object} event event handler
         */
        _onClickButton: function (event) {
            // prevent multiple clicks
            if (event.detail > 1) return;

            var button = event.currentTarget;
            var nextButton = button.hasAttribute(attributes.buttonNext);

            if (
                this.options.type === 'slide' &&
                button.getAttribute('aria-disabled') === 'true'
            ) {
                return;
            }

            if (this.options.autoplay && this.isAutoPlaying) {
                this.stopAutoplay();
            }

            if (nextButton) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        },

        _onClickIndicator: function (event) {
            event.preventDefault();

            if (event.target.classList.contains(classes.indicatorActive)) return;

            if (this.options.autoplay && this.isAutoPlaying) {
                this.stopAutoplay();
            }

            this.slideIndex = Number(event.target.dataset.slideNumber);
            this.goToSlideByIndex(this.slideIndex);
        },

        goToSlideByIndex: function (index) {
            this._setPosition(index);

            if (this.options.type === 'slide' && this.sliderTrack) {
                this.sliderTrack.style.transition = 'transform 500ms ease 0s';
                var newPosition = index * this.slides[0].offsetWidth;

                this.sliderTrack.style.transform = 'translateX(-' + newPosition + 'px)';

                if (this.options.slidesToShow > 1) {
                    this._verifyFirstLastSlideTranslateX(newPosition);

                    if (this.buttons.length) {
                        this._disableArrows();
                    }

                    this._setupMultipleActiveSlide(
                        index,
                        index + (this.options.slidesToShow - 1)
                    );
                }
            }
        },

        _onKeydownIndicator: function (event) {
            if (event.keyCode !== slate.utils.keyboardKeys.ENTER) return;

            this._onClickIndicator(event);

            this.slider.focus();
        },

        _onClickPause: function (event) {
            if (!event.currentTarget.classList.contains(classes.isPaused)) {
                event.currentTarget.classList.add(classes.isPaused);
                this.stopAutoplay();
            } else {
                event.currentTarget.classList.remove(classes.isPaused);
                this.startAutoplay();
            }
        },

        _onFocus: function () {
            this.container.addEventListener('keyup', this.eventHandlers.keyUp);
        },

        _onFocusIn: function () {
            if (this.slider.hasAttribute('aria-live')) return;

            if (this.options.autoplay && this.isAutoPlaying) {
                this.stopAutoplay();
            }

            this.slider.setAttribute('aria-live', 'polite');
        },

        _onBlur: function () {
            this.container.removeEventListener('keyup', this.eventHandlers.keyUp);
        },

        _onFocusOut: function () {
            this.slider.removeAttribute('aria-live');

            // Adding a setTimeout because everytime we focus out
            // It automatically goes to <body>
            // We want to resume autoplay when focus is outside of the slideshow container
            setTimeout(
                function () {
                    if (
                        !document.activeElement.closest(
                            '#' + this.slider.getAttribute('id')
                        )
                    ) {
                        if (
                            this.options.autoplay &&
                            !this.isAutoPlaying &&
                            !this.pause.classList.contains(classes.isPaused)
                        ) {
                            this.startAutoplay();
                        }
                    }
                }.bind(this),
                this.timeout
            );
        },

        _onKeyUp: function (event) {
            switch (event.keyCode) {
                case slate.utils.keyboardKeys.LEFTARROW:
                    if (!this.options.canUseKeyboardArrows) return;

                    if (this.options.type === 'slide' && this.isFirstSlide) {
                        return;
                    }

                    this.previousSlide();

                    break;
                case slate.utils.keyboardKeys.RIGHTARROW:
                    if (!this.options.canUseKeyboardArrows) return;

                    if (this.options.type === 'slide' && this.isLastSlide) {
                        return;
                    }

                    this.nextSlide();

                    break;
                case slate.utils.keyboardKeys.ESCAPE:
                    this.slider.blur();
                    break;
            }
        },

        _move: function (direction) {
            if (this.options.type === 'slide') {
                this.slideIndex = this._getNextSlideIndex(direction);
                this._moveSlideshow(direction);
            } else {
                var nextSlideIndex = this._getNextSlideIndex(direction);
                this._setPosition(nextSlideIndex);
            }
        },

        _moveSlideshow: function (direction) {
            this.direction = direction;
            var valueXToMove = 0;

            // Get current position of translateX
            var currentTranslateXPosition = this._getTranslateXPosition();
            var currentActiveSlidesIndex = this._getActiveSlidesIndex();

            // In the future, we'll use ES6 deconstructure
            // Math.min(...currentActiveSlidesIndex);
            var currentActiveSlidesMinIndex = Math.min.apply(
                Math,
                currentActiveSlidesIndex
            );
            var currentActiveSlidesMaxIndex = Math.max.apply(
                Math,
                currentActiveSlidesIndex
            );

            // Set the next active state depending on the direction
            // We bump up the index depending on the "slidesToShow" option
            this.nextMinIndex =
                direction === 'next'
                    ? currentActiveSlidesMinIndex + this.options.slidesToShow
                    : currentActiveSlidesMinIndex - this.options.slidesToShow;
            this.nextMaxIndex =
                direction === 'next'
                    ? currentActiveSlidesMaxIndex + this.options.slidesToShow
                    : currentActiveSlidesMinIndex - 1;

            this.sliderTrack.style.transition = 'transform 500ms ease 0s';

            if (direction === 'next') {
                valueXToMove = currentTranslateXPosition - this.sliderTranslateXMove;
                this.sliderTrack.style.transform = 'translateX(' + valueXToMove + 'px)';
            } else {
                valueXToMove = currentTranslateXPosition + this.sliderTranslateXMove;
                this.sliderTrack.style.transform = 'translateX(' + valueXToMove + 'px)';
            }

            this._verifyFirstLastSlideTranslateX(valueXToMove);

            this._postTransitionEnd();

            this._setupMultipleActiveSlide(this.nextMinIndex, this.nextMaxIndex);
        },

        _setPosition: function (nextSlideIndex) {
            this.slideIndex = nextSlideIndex;

            if (this.indicators.length) {
                this._setActiveIndicator(nextSlideIndex);
            }

            this._setupActiveSlide(nextSlideIndex);

            if (this.options.autoplay && this.isAutoPlaying) {
                this.startAutoplay();
            }

            this.container.dispatchEvent(
                new CustomEvent('slider_slide_changed', {
                    detail: nextSlideIndex
                })
            );
        },

        _setupActiveSlide: function (index) {
            this.slides.forEach(function (slide) {
                slide.setAttribute('aria-hidden', true);
                slide.classList.remove(this.options.slideActiveClass);
            }, this);

            this.slides[index].setAttribute('aria-hidden', false);
            this.slides[index].classList.add(this.options.slideActiveClass);
        },

        /**
         * Loops through all slide items
         * Set the active state depending the direction and slide indexes
         * Because slide-in effect can have multiple items in 1 slide, we need to target multiple active elements
         * @param {String} direction "next" for next slides or empty string for previous
         * @param {*} minIndex the current active minimum index
         * @param {*} maxIndex the current active maximum index
         */
        _setupMultipleActiveSlide: function (minIndex, maxIndex) {
            this.slides.forEach(function (slide) {
                var sliderIndex = Number(slide.getAttribute('data-slider-slide-index'));
                var sliderItemLink = slide.querySelector(selectors.sliderItemLink);

                slide.setAttribute('aria-hidden', true);
                slide.classList.remove(this.options.slideActiveClass);
                if (sliderItemLink) {
                    sliderItemLink.setAttribute('tabindex', -1);
                }

                if (sliderIndex >= minIndex && sliderIndex <= maxIndex) {
                    slide.setAttribute('aria-hidden', false);
                    slide.classList.add(this.options.slideActiveClass);

                    if (sliderItemLink) {
                        sliderItemLink.setAttribute('tabindex', 0);
                    }
                }
            }, this);
        },

        _setActiveIndicator: function (index) {
            this.indicators.forEach(function (indicatorWrapper) {
                var activeIndicator = indicatorWrapper.querySelector(
                    '.' + classes.indicatorActive
                );

                var nextIndicator = indicatorWrapper.childNodes[index];

                if (activeIndicator) {
                    activeIndicator.setAttribute('aria-selected', false);
                    activeIndicator.classList.remove(classes.indicatorActive);
                    activeIndicator.firstElementChild.removeAttribute('aria-current');
                }

                nextIndicator.classList.add(classes.indicatorActive);
                nextIndicator.setAttribute('aria-selected', true);
                nextIndicator.firstElementChild.setAttribute('aria-current', true);
            }, this);
        },

        setSlideshowHeight: function () {
            var minAspectRatio = this.sliderContainer.getAttribute(
                'data-min-aspect-ratio'
            );
            this.sliderContainer.style.height =
                document.documentElement.offsetWidth / minAspectRatio + 'px';
        },

        /**
         * Increase or decrease index position of the slideshow
         * Automatically auto-rotate
         * - Last slide goes to first slide when clicking "next"
         * - First slide goes to last slide when clicking "previous"
         * @param {String} direction "next" as a String, other empty string is previous slide
         */
        _getNextSlideIndex: function (direction) {
            var counter = direction === 'next' ? 1 : -1;

            if (direction === 'next') {
                if (this.slideIndex === this.lastSlide) {
                    return this.options.type === 'slide' ? this.lastSlide : 0;
                }
            } else if (!this.slideIndex) {
                return this.options.type === 'slide' ? 0 : this.lastSlide;
            }

            return this.slideIndex + counter;
        },

        /**
         * In "slide-in" type, multiple items are active in 1 slide
         * This will return an array containing their indexes
         */
        _getActiveSlidesIndex: function () {
            var currentActiveSlides = this.slides.filter(function (sliderItem) {
                if (sliderItem.classList.contains(this.options.slideActiveClass)) {
                    return sliderItem;
                }
            }, this);
            var currentActiveSlidesIndex = currentActiveSlides.map(function (
                sliderItem
            ) {
                return Number(sliderItem.getAttribute('data-slider-slide-index'));
            });

            return currentActiveSlidesIndex;
        },

        /**
         * This checks the next "translateX" value and verifies
         * If it's at the last slide or beginning of the slide
         * So we can disable the arrow buttons
         */
        _disableArrows: function () {
            if (this.buttons.length === 0) return;

            var previousButton = this.buttons[0];
            var nextButton = this.buttons[1];

            // first slide
            if (this.isFirstSlide) {
                previousButton.setAttribute('aria-disabled', true);
            } else {
                previousButton.removeAttribute('aria-disabled');
            }

            // last slide
            if (this.isLastSlide) {
                nextButton.setAttribute('aria-disabled', true);
            } else {
                nextButton.removeAttribute('aria-disabled');
            }
        },

        /**
         * Verify if translateX reaches at first or last slide
         * @param {Number} translateXValue
         */
        _verifyFirstLastSlideTranslateX: function (translateXValue) {
            // first slide
            if (this._isNextTranslateXFirst(translateXValue)) {
                this.isFirstSlide = true;
            } else {
                this.isFirstSlide = false;
            }

            // last slide
            if (this._isNextTranslateXLast(translateXValue)) {
                this.isLastSlide = true;
            } else {
                this.isLastSlide = false;
            }
        },

        _getTranslateXPosition: function () {
            return Number(this.sliderTrack.style.transform.match(/(-?[0-9]+)/g)[0]);
        },

        _isNextTranslateXFirst: function (translateXValue) {
            return translateXValue === 0;
        },

        _isNextTranslateXLast: function (translateXValue) {
            // because translateX values are using negative, I'm converting into positive value
            var translateXValueAbsolute = Math.abs(translateXValue);
            var nextTranslateXValue =
                translateXValueAbsolute + this.sliderTranslateXMove;

            return nextTranslateXValue >= this.sliderItemWidthTotal;
        },

        _postTransitionEnd: function () {
            if (this.buttons.length) {
                this._disableArrows();
            }

            if (this.indicators.length) {
                this._setActiveIndicator(this.slideIndex);
            }
        }
    });

    return Slideshow;
})();

export default Slideshow