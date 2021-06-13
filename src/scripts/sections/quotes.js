import Slideshow from '../snippets/slideshow'

const Quotes = (function () {
    function Quotes() {
        this.onLoad = function () {
            var config = {
                mediaQuerySmall: 'screen and (max-width: 749px)',
                mediaQueryMediumUp: 'screen and (min-width: 750px)',
                slideCount: 0
            };

            var defaults = {
                canUseKeyboardArrows: false,
                type: 'slide',
                slidesToShow: 3
            };

            var container = this.container;
            var sectionId = container.getAttribute('data-section-id');
            this.slider = document.getElementById('Quotes-' + sectionId);

            this.sliderActive = false;

            this.mobileOptions = Object.assign({}, defaults, {
                canUseTouchEvents: true,
                slidesToShow: 1
            });

            this.desktopOptions = Object.assign({}, defaults, {
                slidesToShow: Math.min(
                    defaults.slidesToShow,
                    this.slider.getAttribute('data-count')
                )
            });

            this.initMobileSlider = this._initMobileSlider.bind(this);
            this.initDesktopSlider = this._initDesktopSlider.bind(this);

            this.mqlSmall = window.matchMedia(config.mediaQuerySmall);
            this.mqlSmall.addListener(this.initMobileSlider);

            this.mqlMediumUp = window.matchMedia(config.mediaQueryMediumUp);
            this.mqlMediumUp.addListener(this.initDesktopSlider);

            this.initMobileSlider();
            this.initDesktopSlider();
        }

        this.onUnload = function () {
            this.mqlSmall.removeListener(this.initMobileSlider);
            this.mqlMediumUp.removeListener(this.initDesktopSlider);
            this.slideshow.destroy();
        }

        // eslint-disable-next-line no-unused-vars
        this.onBlockSelect = function (evt) {
            var slide = document.querySelector(
                '.quotes-slide--' + evt.detail.blockId
            );
            var slideIndex = Number(slide.getAttribute('data-slider-slide-index'));

            if (this.mqlMediumUp.matches) {
                slideIndex = Math.max(
                    0,
                    Math.min(slideIndex, this.slideshow.slides.length - 3)
                );
            }

            this.slideshow.goToSlideByIndex(slideIndex);
        }

        this._initMobileSlider = function () {
            if (this.mqlSmall.matches) {
                this._initSlider(this.mobileOptions);
            }
        }

        this._initDesktopSlider = function () {
            if (this.mqlMediumUp.matches) {
                this._initSlider(this.desktopOptions);
            }
        }

        // eslint-disable-next-line no-unused-vars
        this._initSlider = function (args) {
            if (this.sliderActive) {
                this.slideshow.destroy();
                this.sliderActive = false;
            }

            this.slideshow = new Slideshow(this.container, args);
            this.sliderActive = true;
        }
    }

    return Quotes;
})()

export default Quotes