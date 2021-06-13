const ProductRecommendations = (function () {
    function ProductRecommendations() {
        this.onLoad = function () {
            var container = this.container;
            var baseUrl = container.dataset.baseUrl;
            var productId = container.dataset.productId;
            var recommendationsSectionUrl =
                baseUrl +
                '?section_id=product-recommendations&product_id=' +
                productId +
                '&limit=4';

            window.performance.mark(
                'debut:product:fetch_product_recommendations.start'
            );

            fetch(recommendationsSectionUrl)
                .then(function (response) {
                    return response.text();
                })
                .then(function (productHtml) {
                    if (productHtml.trim() === '') return;

                    container.innerHTML = productHtml;
                    container.innerHTML = container.firstElementChild.innerHTML;

                    window.performance.mark(
                        'debut:product:fetch_product_recommendations.end'
                    );

                    performance.measure(
                        'debut:product:fetch_product_recommendations',
                        'debut:product:fetch_product_recommendations.start',
                        'debut:product:fetch_product_recommendations.end'
                    );
                });
        }
    }
    return ProductRecommendations;
})();

export default ProductRecommendations;