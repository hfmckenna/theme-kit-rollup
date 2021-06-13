import Helpers from "../helpers/helpers";

const Maps = (function () {
    function Maps() {
        this.onLoad = function () {
            var config = {
                zoom: 14
            };
            var apiStatus = null;
            var mapsToLoad = [];

            var errors = {
                addressNoResults: theme.strings.addressNoResults,
                addressQueryLimit: theme.strings.addressQueryLimit,
                addressError: theme.strings.addressError,
                authError: theme.strings.authError
            };

            var selectors = {
                section: '[data-section-type="map"]',
                map: '[data-map]',
                mapOverlay: '[data-map-overlay]'
            };

            var classes = {
                mapError: 'map-section--load-error',
                errorMsg: 'map-section__error errors text-center'
            };

            // Global function called by Google on auth errors.
            // Show an auto error message on all map instances.
            // eslint-disable-next-line camelcase, no-unused-vars
            window.gm_authFailure = function () {
                if (!Shopify.designMode) {
                    return;
                }

                document.querySelector(selectors.section).classList.add(classes.mapError);
                document.querySelector(selectors.map).remove();
                document
                    .querySelector(selectors.mapOverlay)
                    .insertAdjacentHTML(
                        'afterend',
                        '<div class="' +
                        classes.errorMsg +
                        '">' +
                        theme.strings.authError +
                        '</div>'
                    );
            };

            this.map = this.container.querySelector(selectors.map);
            if (!this.map) return;
            this.key = this.map.dataset.apiKey;

            if (typeof this.key === 'undefined') {
                return;
            }

            if (apiStatus === 'loaded') {
                this.createMap();
            } else {
                mapsToLoad.push(this);

                if (apiStatus !== 'loading') {
                    apiStatus = 'loading';
                    if (typeof window.google === 'undefined') {
                        Helpers.getScript(
                            'https://maps.googleapis.com/maps/api/js?key=' + this.key
                        ).then(function () {
                            apiStatus = 'loaded';
                            this.initAllMaps();
                        });
                    }
                }
            }
        }

        this.initAllMaps = function () {
            // API has loaded, load all Map instances in queue
            mapsToLoad.forEach(function (map) {
                map.createMap();
            });
        }

        this.geolocate = function (map) {
            return new Promise(function (resolve, reject) {
                var geocoder = new google.maps.Geocoder();
                var address = map.dataset.addressSetting;

                geocoder.geocode({address: address}, function (results, status) {
                    if (status !== google.maps.GeocoderStatus.OK) {
                        reject(status);
                    }

                    resolve(results);
                });
            });
        }

        this.createMap = function () {
            return this.geolocate(this.map)
                .then(
                    function (results) {
                        var mapOptions = {
                            zoom: config.zoom,
                            center: results[0].geometry.location,
                            draggable: false,
                            clickableIcons: false,
                            scrollwheel: false,
                            disableDoubleClickZoom: true,
                            disableDefaultUI: true
                        };

                        var map = (this.map = new google.maps.Map(this.map, mapOptions));
                        var center = (this.center = map.getCenter());

                        //eslint-disable-next-line no-unused-vars
                        var marker = new google.maps.Marker({
                            map: map,
                            position: map.getCenter()
                        });

                        google.maps.event.addDomListener(
                            window,
                            'resize',
                            Helpers.debounce(
                                function () {
                                    google.maps.event.trigger(map, 'resize');
                                    map.setCenter(center);
                                    this.map.removeAttribute('style');
                                }.bind(this),
                                250
                            )
                        );
                    }.bind(this)
                )
                .catch(
                    function () {
                        var errorMessage;

                        switch (status) {
                            case 'ZERO_RESULTS':
                                errorMessage = errors.addressNoResults;
                                break;
                            case 'OVER_QUERY_LIMIT':
                                errorMessage = errors.addressQueryLimit;
                                break;
                            case 'REQUEST_DENIED':
                                errorMessage = errors.authError;
                                break;
                            default:
                                errorMessage = errors.addressError;
                                break;
                        }

                        // Show errors only to merchant in the editor.
                        if (Shopify.designMode) {
                            this.map.parentNode.classList.add(classes.mapError);
                            this.map.parentNode.innerHTML =
                                '<div class="' +
                                classes.errorMsg +
                                '">' +
                                errorMessage +
                                '</div>';
                        }
                    }.bind(this)
                );
        }

        this.onUnload = function () {
            if (this.map) {
                google.maps.event.clearListeners(this.map, 'resize');
            }
        }
    }
    return Maps;
})();

export default Maps;