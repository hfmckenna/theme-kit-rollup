import Slideshow from "../snippets/slideshow";

const SlideshowSection = function () {
    this.onLoad = function () {
        var selectors = {
            sliderMobileContentIndex: '[data-slider-mobile-content-index]'
        };

        var container = this.container;
        var sectionId = container.dataset.sectionId;

        this.container = container;
        this.eventHandlers = {};
        this.slideshowDom = container.querySelector('#Slideshow-' + sectionId);
        this.sliderMobileContentIndex = container.querySelectorAll(
            selectors.sliderMobileContentIndex
        );

        this.slideshow = new Slideshow(container, {
            autoplay: this.slideshowDom.getAttribute('data-autorotate') === 'true',
            slideInterval: this.slideshowDom.getAttribute('data-speed')
        });
        this._setupEventListeners();
    }

    this._setupEventListeners = function () {
        this.eventHandlers.onSliderSlideChanged = function (event) {
            this._onSliderSlideChanged(event.detail);
        }.bind(this);

        this.container.addEventListener(
            'slider_slide_changed',
            this.eventHandlers.onSliderSlideChanged
        );
    }

    this._onSliderSlideChanged = function (slideIndex) {
        var activeClass = 'slideshow__text-content--mobile-active';

        this.sliderMobileContentIndex.forEach(function (element) {
            if (
                Number(element.getAttribute('data-slider-mobile-content-index')) ===
                slideIndex
            ) {
                element.classList.add(activeClass);
            } else {
                element.classList.remove(activeClass);
            }
        });
    }

    this.onUnload = function () {
        this.slideshow.destroy();
    }

    this.onBlockSelect = function (evt) {
        if (this.slideshow.adaptHeight) {
            this.slideshow.setSlideshowHeight();
        }

        // Get slide's index using theme editor's id
        var slide = this.container.querySelector(
            '.slideshow__slide--' + evt.detail.blockId
        );
        var slideIndex = slide.getAttribute('data-slider-slide-index');

        // Go to selected slide, pause auto-rotate
        this.slideshow.setSlide(slideIndex);
        this.slideshow.stopAutoplay();
    }

    this.onBlockDeselect = function () {
        // Resume auto-rotate
        this.slideshow.startAutoplay();
    }
};

export default SlideshowSection;