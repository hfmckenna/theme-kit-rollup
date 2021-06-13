import Helpers from '../helpers/helpers'

window.theme.heros = {};

const Hero = (function () {
    var classes = {
        indexSectionFlush: 'index-section--flush'
    };

    var selectors = {
        heroFixedWidthContent: '.hero-fixed-width__content',
        heroFixedWidthImage: '.hero-fixed-width__image'
    };

    function hero(el, sectionId) {
        var hero = document.querySelector(el);
        var layout = hero.getAttribute('data-layout');
        var parentSection = document.querySelector('#shopify-section-' + sectionId);
        var heroContent = parentSection.querySelector(
            selectors.heroFixedWidthContent
        );
        var heroImage = parentSection.querySelector(selectors.heroFixedWidthImage);

        if (layout !== 'fixed_width') {
            return;
        }

        parentSection.classList.remove(classes.indexSectionFlush);
        heroFixedHeight();

        window.addEventListener('resize', function () {
            Helpers.debounce(function () {
                heroFixedHeight();
            }, 50);
        });

        function heroFixedHeight() {
            var contentHeight;
            var imageHeight;

            if (heroContent) {
                contentHeight = heroContent.offsetHeight + 50;
            }

            if (heroImage) {
                imageHeight = heroImage.offsetHeight;
            }

            if (contentHeight > imageHeight) {
                heroImage.style.minHeight = contentHeight + 'px';
            }
        }
    }

    return hero;
})();

const HeroSection = function () {
    this.onLoad = function () {
        var hero = '#Hero-' + this.id;
        window.theme.heros[hero] = new Hero(hero, this.id);
    }
}

export default HeroSection;