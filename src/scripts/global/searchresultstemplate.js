import {getSizedImageUrl} from "@shopify/theme-images";
import {formatMoney} from "@shopify/theme-currency";

const SearchResultsTemplate = (function () {
    function renderResults(products, isLoading, searchQuery) {
        return [
            '<div class="predictive-search">',
            renderHeader(products, isLoading),
            renderProducts(products, searchQuery),
            '</div>'
        ].join('');
    }

    function renderHeader(products, isLoading) {
        if (products.length === 0) {
            return '';
        }

        return [
            '<div class="predictive-search-title">',
            '<h3 id="predictive-search" class="predictive-search-title__content">' +
            theme.strings.products +
            '</h3>',
            '<span class="predictive-search-title__loading-spinner">' +
            (isLoading
                ? '<span class= "icon-predictive-search-spinner" ></span >'
                : '') +
            '</span>',
            '</div>'
        ].join('');
    }

    function loadingState() {
        return [
            '<div class="predictive-search">',
            '<div class="predictive-search-loading">',
            '<span class="visually-hidden">' + theme.strings.loading + '</span>',
            '<span class="predictive-search-loading__icon">',
            '<span class="icon-predictive-search-spinner"></span>',
            '</span>',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderViewAll(searchQuery) {
        return [
            '<button type="submit" class="predictive-search-view-all__button" tabindex="-1">',
            theme.strings.searchFor +
            '<span class="predictive-search-view-all__query"> &ldquo;' +
            _htmlEscape(searchQuery) +
            '&rdquo;</span>',
            '</button>'
        ].join('');
    }

    function renderProducts(products, searchQuery) {
        var resultsCount = products.length;

        return [
            '<ul id="predictive-search-results" class="predictive-search__list" role="listbox" aria-labelledby="predictive-search">',
            products
                .map(function (product, index) {
                    return renderProduct(normalizeProduct(product), index, resultsCount);
                })
                .join(''),
            '<li id="search-all" class="predictive-search-view-all" role="option" data-search-result>' +
            renderViewAll(searchQuery) +
            '</li>',
            '</ul>'
        ].join('');
    }

    function renderProduct(product, index, resultsCount) {
        return [
            '<li id="search-result-' +
            index +
            '" class="predictive-search-item" role="option" data-search-result>',
            '<a class="predictive-search-item__link" href="' +
            product.url +
            '" tabindex="-1">',
            '<div class="predictive-search__column predictive-search__column--image" data-image-loading-animation>',
            renderProductImage(product),
            '</div>',
            '<div class="predictive-search__column predictive-search__column--content ' +
            (getDetailsCount() ? '' : 'predictive-search__column--center') +
            '">',
            '<span class="predictive-search-item__title">',
            '<span class="predictive-search-item__title-text">' +
            product.title +
            '</span>',
            '</span>' + (getDetailsCount() ? renderProductDetails(product) : ''),
            '<span class="visually-hidden">, </span>',
            '<span class="visually-hidden">' +
            getNumberOfResultsString(index + 1, resultsCount) +
            '</span>',
            '</div>',
            '</a>',
            '</li>'
        ].join('');
    }

    function renderProductImage(product) {
        if (product.image === null) {
            return '';
        }

        return (
            '<img class="predictive-search-item__image lazyload" src="' +
            product.image.url +
            '" data-src="' +
            product.image.url +
            '" data-image alt="' +
            product.image.alt +
            '" />'
        );
    }

    function renderProductDetails(product) {
        return [
            '<dl class="predictive-search-item__details price' +
            (product.isOnSale ? ' price--on-sale' : '') +
            (!product.available ? ' price--sold-out' : '') +
            (!product.isPriceVaries && product.isCompareVaries
                ? ' price--compare-price-hidden'
                : '') +
            '">',
            '<div class="predictive-search-item__detail">',
            renderVendor(product),
            '</div>',
            '<div class="predictive-search-item__detail predictive-search-item__detail--inline">' +
            renderProductPrice(product),
            '</div>',
            '</dl>'
        ].join('');
    }

    function renderProductPrice(product) {
        if (!theme.settings.predictiveSearchShowPrice) {
            return '';
        }

        var accessibilityAnnounceComma = '<span class="visually-hidden">, </span>';

        var priceMarkup =
            '<div class="price__regular">' + renderPrice(product) + '</div>';

        var salePriceMarkup =
            '<div class="price__sale">' + renderSalePrice(product) + '</div>';

        return (
            accessibilityAnnounceComma +
            '<div class="price__pricing-group">' +
            (product.isOnSale ? salePriceMarkup : priceMarkup) +
            '</div>'
        );
    }

    function renderSalePrice(product) {
        return [
            '<dt>',
            '<span class="visually-hidden">' + theme.strings.salePrice + '</span>',
            '</dt>',
            '<dd>',
            '<span class="predictive-search-item__price predictive-search-item__price--sale">' +
            (product.isPriceVaries
                ? theme.strings.fromLowestPrice.replace('[price]', product.price)
                : product.price) +
            '</span>',
            '</dd>',
            '<div class="price__compare">' + renderCompareAtPrice(product) + '</div>'
        ].join('');
    }

    function renderCompareAtPrice(product) {
        return [
            '<dt>',
            '<span class="visually-hidden">' +
            theme.strings.regularPrice +
            '</span> ',
            '</dt>',
            '<dd>',
            '<span class="predictive-search-item__price predictive-search-item__price--compare">' +
            product.compareAtPrice +
            '</span>',
            '</dd>'
        ].join('');
    }

    function renderPrice(product) {
        return [
            '<dt>',
            '<span class="visually-hidden">' + theme.strings.regularPrice + '</span>',
            '</dt>',
            '<dd>',
            '<span class="predictive-search-item__price">' +
            (product.isPriceVaries
                ? theme.strings.fromLowestPrice.replace('[price]', product.price)
                : product.price) +
            '</span>',
            '</dd>'
        ].join('');
    }

    function renderVendor(product) {
        if (!theme.settings.predictiveSearchShowVendor || product.vendor === '') {
            return '';
        }

        return [
            '<dt>',
            '<span class="visually-hidden">' + theme.strings.vendor + '</span>',
            '</dt>',
            '<dd class="predictive-search-item__vendor">' + product.vendor + '</dd>'
        ].join('');
    }

    function normalizeProduct(product) {
        var productOrVariant =
            product.variants.length > 0 ? product.variants[0] : product;

        return {
            url: productOrVariant.url,
            image: getProductImage(product),
            title: product.title,
            vendor: product.vendor || '',
            price: formatMoney(product.price_min, theme.moneyFormat),
            compareAtPrice: formatMoney(
                product.compare_at_price_min,
                theme.moneyFormat
            ),
            available: product.available,
            isOnSale: isOnSale(product),
            isPriceVaries: isPriceVaries(product),
            isCompareVaries: isCompareVaries(product)
        };
    }

    function getProductImage(product) {
        var image;
        var featuredImage;

        if (product.variants.length > 0 && product.variants[0].image !== null) {
            featuredImage = product.variants[0].featured_image;
        } else if (product.image) {
            featuredImage = product.featured_image;
        } else {
            image = null;
        }

        if (image !== null) {
            image = {
                url: getSizedImageUrl(featuredImage.url, '100x'),
                alt: featuredImage.alt
            };
        }

        return image;
    }

    function isOnSale(product) {
        return (
            product.compare_at_price_min !== null &&
            parseInt(product.compare_at_price_min, 10) >
            parseInt(product.price_min, 10)
        );
    }

    function isPriceVaries(product) {
        return product.price_max !== product.price_min;
    }

    function isCompareVaries(product) {
        return product.compare_at_price_max !== product.compare_at_price_min;
    }

    // Returns the number of optional product details to be shown,
    // values of the detailsList need to be boolean.
    function getDetailsCount() {
        var detailsList = [
            theme.settings.predictiveSearchShowPrice,
            theme.settings.predictiveSearchShowVendor
        ];

        var detailsCount = detailsList.reduce(function (acc, detail) {
            return acc + (detail ? 1 : 0);
        }, 0);

        return detailsCount;
    }

    function getNumberOfResultsString(resultNumber, resultsCount) {
        return theme.strings.number_of_results
            .replace('[result_number]', resultNumber)
            .replace('[results_count]', resultsCount);
    }

    function _htmlEscape(input) {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return function (data) {
        var products = data.products || [];
        var isLoading = data.isLoading;
        var searchQuery = data.searchQuery || '';

        if (isLoading && products.length === 0) {
            return loadingState();
        }

        return renderResults(products, isLoading, searchQuery);
    };
})();

export default SearchResultsTemplate;