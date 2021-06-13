import * as slate from './helpers/slate'
import * as sections from '@shopify/theme-sections'
import Product from './sections/product'
import Cart from './sections/cart'
import Filters from './sections/filters'
import HeaderSection from './sections/header'
import Maps from './sections/maps'
import Slideshow from './sections/slideshow'
import StoreAvailability from './sections/storeavailability'
import {Video, VideoSection} from './sections/video'
import Quotes from './sections/quotes'
import HeroSection from './sections/herosection'
import ProductRecommendations from './sections/productrecommendations'
import Footer from './sections/footer'
import FormStatus from './global/formstatus'
import CustomerTemplates from './global/customertemplates'
import Modals from './global/modals';
import SearchDrawer from './global/searchdrawer'
import PredictiveSearchComponent from "@shopify/theme-predictive-search-component";
import SearchResultsTemplate from "./global/searchresultstemplate";

window.Modals = Modals;
window.theme = window.theme || {};
window.theme.sections = sections || {};

Shopify = Shopify || {};
Shopify.theme = Shopify.theme || {};

var selectors = {
    backButton: '.return-link'
};

var backButton = document.querySelector(selectors.backButton);

if (!document.referrer || !backButton || !window.history.length) {
} else {

    backButton.addEventListener(
        'click',
        function (evt) {
            evt.preventDefault();

            var referrerDomain = urlDomain(document.referrer);
            var shopDomain = urlDomain(window.location.href);

            if (shopDomain === referrerDomain) {
                history.back();
            }

            return false;
        },
        {once: true}
    );
}

function urlDomain(url) {
    var anchor = document.createElement('a');
    anchor.ref = url;

    return anchor.hostname;
}

// (a11y) This function will be used by the Predictive Search Component
// to announce the number of search results
function numberOfResultsTemplateFct(data) {
    if (data.products.length === 1) {
        return theme.strings.one_result_found;
    } else {
        return theme.strings.number_of_results_found.replace(
            '[results_count]',
            data.products.length
        );
    }
}

// (a11y) This function will be used by the Predictive Search Component
// to announce that it's loading results
function loadingResultsMessageTemplateFct() {
    return theme.strings.loading;
}

function isPredictiveSearchSupported() {
    var shopifyFeatures = JSON.parse(
        document.getElementById('shopify-features').textContent
    );

    return shopifyFeatures.predictiveSearch;
}

function isPredictiveSearchEnabled() {
    return window.theme.settings.predictiveSearchEnabled;
}

function canInitializePredictiveSearch() {
    return isPredictiveSearchSupported() && isPredictiveSearchEnabled();
}

// listen for search submits and validate query
function validateSearchHandler(searchEl, submitEl) {
    submitEl.addEventListener(
        'click',
        validateSearchInput.bind(this, searchEl)
    );
}

// if there is nothing in the search field, prevent submit
function validateSearchInput(searchEl, evt) {
    var isInputValueEmpty = searchEl.value.trim().length === 0;
    if (!isInputValueEmpty) {
        return;
    }

    if (typeof evt !== 'undefined') {
        evt.preventDefault();
    }

    searchEl.focus();
}

window.theme.SearchPage = (function () {
    var selectors = {
        searchReset: '[data-search-page-predictive-search-clear]',
        searchInput: '[data-search-page-predictive-search-input]',
        searchSubmit: '[data-search-page-predictive-search-submit]',
        searchResults: '[data-predictive-search-mount="default"]'
    };

    var componentInstance;

    function init(config) {
        var searchInput = document.querySelector(selectors.searchInput);
        var searchSubmit = document.querySelector(selectors.searchSubmit);
        var searchUrl = searchInput.dataset.baseUrl;

        componentInstance = new PredictiveSearchComponent({
            selectors: {
                input: selectors.searchInput,
                reset: selectors.searchReset,
                result: selectors.searchResults
            },
            searchUrl: searchUrl,
            resultTemplateFct: SearchResultsTemplate,
            numberOfResultsTemplateFct: numberOfResultsTemplateFct,
            loadingResultsMessageTemplateFct: loadingResultsMessageTemplateFct,
            onOpen: function (nodes) {
                if (config.isTabletAndUp) {
                    return;
                }

                var searchInputBoundingRect = searchInput.getBoundingClientRect();
                var bodyHeight = document.body.offsetHeight;
                var offset = 50;
                var resultsMaxHeight =
                    bodyHeight - searchInputBoundingRect.bottom - offset;

                nodes.result.style.maxHeight = resultsMaxHeight + 'px';
            },
            onBeforeDestroy: function (nodes) {
                // If the viewport width changes from mobile to tablet
                // reset the top position of the results
                nodes.result.style.maxHeight = '';
            }
        });

        validateSearchHandler(searchInput, searchSubmit);
    }

    function unload() {
        if (!componentInstance) {
            return;
        }
        componentInstance.destroy();
        componentInstance = null;
    }

    return {
        init: init,
        unload: unload
    };
})();

window.theme.SearchHeader = (function () {
    var selectors = {
        searchInput: '[data-predictive-search-drawer-input]',
        searchResults: '[data-predictive-search-mount="drawer"]',
        searchFormContainer: '[data-search-form-container]',
        searchSubmit: '[data-search-form-submit]'
    };

    var componentInstance;

    function init(config) {
        var searchInput = document.querySelector(selectors.searchInput);
        var searchSubmit = document.querySelector(selectors.searchSubmit);
        var searchUrl = searchInput.dataset.baseUrl;

        componentInstance = new PredictiveSearchComponent({
            selectors: {
                input: selectors.searchInput,
                result: selectors.searchResults
            },
            searchUrl: searchUrl,
            resultTemplateFct: SearchResultsTemplate,
            numberOfResultsTemplateFct: numberOfResultsTemplateFct,
            numberOfResults: config.numberOfResults,
            loadingResultsMessageTemplateFct: loadingResultsMessageTemplateFct,
            onInputBlur: function () {
                return false;
            },
            onOpen: function (nodes) {
                var searchInputBoundingRect = searchInput.getBoundingClientRect();

                // For tablet screens and up, stop the scroll area from extending past
                // the bottom of the screen because we're locking the body scroll
                var maxHeight =
                    window.innerHeight -
                    searchInputBoundingRect.bottom -
                    (config.isTabletAndUp ? 20 : 0);

                nodes.result.style.top = config.isTabletAndUp
                    ? ''
                    : searchInputBoundingRect.bottom + 'px';
                nodes.result.style.maxHeight = maxHeight + 'px';
            },
            onClose: function (nodes) {
                nodes.result.style.maxHeight = '';
            },
            onBeforeDestroy: function (nodes) {
                // If the viewport width changes from mobile to tablet
                // reset the top position of the results
                nodes.result.style.top = '';
            }
        });

        validateSearchHandler(searchInput, searchSubmit);
    }

    function unload() {
        if (!componentInstance) {
            return;
        }

        componentInstance.destroy();
        componentInstance = null;
    }

    function clearAndClose() {
        if (!componentInstance) {
            return;
        }

        componentInstance.clearAndClose();
    }

    return {
        init: init,
        unload: unload,
        clearAndClose: clearAndClose
    };
})();

window.theme.Search = (function () {
    var classes = {
        searchTemplate: 'template-search'
    };
    var selectors = {
        siteHeader: '.site-header'
    };
    var mediaQueryList = {
        mobile: window.matchMedia('(max-width: 749px)'),
        tabletAndUp: window.matchMedia('(min-width: 750px)')
    };

    function init() {
        if (!document.querySelector(selectors.siteHeader)) {
            return;
        }

        if (!canInitializePredictiveSearch()) {
            return;
        }

        Object.keys(mediaQueryList).forEach(function (device) {
            mediaQueryList[device].addListener(initSearchAccordingToViewport);
        });

        initSearchAccordingToViewport();
    }

    function initSearchAccordingToViewport() {
        SearchDrawer.close();
        theme.SearchHeader.unload();
        theme.SearchPage.unload();

        if (mediaQueryList.mobile.matches) {
            theme.SearchHeader.init({
                numberOfResults: 4,
                isTabletAndUp: false
            });

            if (isSearchPage()) {
                theme.SearchPage.init({isTabletAndUp: false});
            }
        } else {
            // Tablet and up
            theme.SearchHeader.init({
                numberOfResults: 4,
                isTabletAndUp: true
            });

            if (isSearchPage()) {
                theme.SearchPage.init({isTabletAndUp: true});
            }
        }
    }

    function isSearchPage() {
        return document.body.classList.contains(classes.searchTemplate);
    }

    function unload() {
        theme.SearchHeader.unload();
        theme.SearchPage.unload();
    }

    return {
        init: init,
        unload: unload
    };
})();

/* ================ TEMPLATES ================ */
var filterBys = document.querySelectorAll('[data-blog-tag-filter]');

if (filterBys.length) {
    slate.utils.resizeSelects(filterBys);

    filterBys.forEach(function (filterBy) {
        filterBy.addEventListener('change', function (evt) {
            location.href = evt.target.value;
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    function assignContainer(type) {
        return document.querySelector('[data-section-type="' + type + '"]');
    }

    sections.register('cart-template', new Cart(assignContainer('cart-template')));
    sections.register('product', new Product(assignContainer('product')));
    sections.register('collection-template', new Filters);
    sections.register('product-template', new Product(assignContainer('product-template')));
    sections.register('header-section', new HeaderSection);
    sections.register('map', new Maps);
    sections.register('slideshow-section', new Slideshow);
    sections.register('store-availability', new StoreAvailability(assignContainer('store-availability')));
    sections.register('video-section', new VideoSection);
    sections.register('quotes', new Quotes);
    sections.register('hero-section', new HeroSection);
    sections.register('product-recommendations', new ProductRecommendations);
    sections.register('footer-section', new Footer);

    sections.load('*');

    CustomerTemplates.init.bind(window);

    // Theme-specific selectors to make tables scrollable
    var tableSelectors = '.rte table,' + '.custom__item-inner--html table';

    slate.rte.wrapTable({
        tables: document.querySelectorAll(tableSelectors),
        tableWrapperClass: 'scrollable-wrapper'
    });

    // Theme-specific selectors to make iframes responsive
    var iframeSelectors =
        '.rte iframe[src*="youtube.com/embed"],' +
        '.rte iframe[src*="player.vimeo"],' +
        '.custom__item-inner--html iframe[src*="youtube.com/embed"],' +
        '.custom__item-inner--html iframe[src*="player.vimeo"]';

    slate.rte.wrapIframe({
        iframes: document.querySelectorAll(iframeSelectors),
        iframeWrapperClass: 'video-wrapper'
    });

    // Common a11y fixes
    slate.a11y.pageLinkFocus(
        document.getElementById(window.location.hash.substr(1))
    );

    var inPageLink = document.querySelector('.in-page-link');
    if (inPageLink) {
        inPageLink.addEventListener('click', function (evt) {
            slate.a11y.pageLinkFocus(
                document.getElementById(evt.currentTarget.hash.substr(1))
            );
        });
    }

    document.querySelectorAll('a[href="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (evt) {
            evt.preventDefault();
        });
    });

    slate.a11y.accessibleLinks({
        messages: {
            newWindow: theme.strings.newWindow,
            external: theme.strings.external,
            newWindowExternal: theme.strings.newWindowExternal
        },
        links: document.querySelectorAll(
            'a[href]:not([aria-describedby]), .product-single__thumbnail'
        )
    });

    FormStatus.init();

    var selectors = {
        image: '[data-image]',
        lazyloaded: '.lazyloaded'
    };

    document.addEventListener('lazyloaded', function (evt) {
        var image = evt.target;

        removeImageLoadingAnimation(image);

        if (document.body.classList.contains('template-index')) {
            var mainContent = document.getElementById('MainContent');

            if (mainContent && mainContent.children && mainContent.children.length) {
                var firstSection = document.getElementsByClassName('index-section')[0];

                if (!firstSection.contains(image)) return;

                window.performance.mark('debut:index:first_image_visible');
            }
        }

        if (image.hasAttribute('data-bgset')) {
            var innerImage = image.querySelector(selectors.lazyloaded);

            if (innerImage) {
                var alt = image.getAttribute('data-alt');
                var src = innerImage.hasAttribute('data-src')
                    ? innerImage.getAttribute('data-src')
                    : image.getAttribute('data-bg');

                image.setAttribute('alt', alt ? alt : '');
                image.setAttribute('src', src ? src : '');
            }
        }

        if (!image.hasAttribute('data-image')) {
            return;
        }
    });

    // When the theme loads, lazysizes might load images before the "lazyloaded"
    // event listener has been attached. When this happens, the following function
    // hides the loading placeholders.
    function onLoadHideLazysizesAnimation() {
        var alreadyLazyloaded = document.querySelectorAll('.lazyloaded');
        alreadyLazyloaded.forEach(function (image) {
            removeImageLoadingAnimation(image);
        });
    }

    onLoadHideLazysizesAnimation();

    document.addEventListener(
        'touchstart',
        function () {
            theme.Helpers.setTouch();
        },
        {once: true}
    );

    if (document.fonts) {
        document.fonts.ready.then(function () {
            window.performance.mark('debut:fonts_loaded');
        });
    }
});

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
    Video.loadVideos();
}

function removeImageLoadingAnimation(image) {
    // Remove loading animation
    var imageWrapper = image.hasAttribute('data-image-loading-animation')
        ? image
        : image.closest('[data-image-loading-animation]');

    if (imageWrapper) {
        imageWrapper.removeAttribute('data-image-loading-animation');
    }
}