import Helpers from "../helpers/helpers";

const Zoom = (function () {
    var selectors = {
        imageZoom: '[data-image-zoom]'
    };

    var classes = {
        zoomImg: 'zoomImg'
    };theme.ProductVideo = (function () {
        var videos = {};

        var hosts = {
            shopify: 'shopify',
            external: 'external'
        };

        var selectors = {
            productMediaWrapper: '[data-product-single-media-wrapper]'
        };

        var attributes = {
            enableVideoLooping: 'enable-video-looping',
            videoId: 'video-id'
        };

        function init(videoContainer, sectionId) {
            if (!videoContainer) {
                return;
            }

            var videoElement = videoContainer.querySelector('iframe, video');

            if (!videoElement) {
                return;
            }

            var mediaId = videoContainer.getAttribute('data-media-id');

            videos[mediaId] = {
                mediaId: mediaId,
                sectionId: sectionId,
                host: hostFromVideoElement(videoElement),
                container: videoContainer,
                element: videoElement,
                ready: function () {
                    createPlayer(this);
                }
            };

            window.Shopify.loadFeatures([
                {
                    name: 'video-ui',
                    version: '2.0',
                    onLoad: setupVideos
                }
            ]);
            theme.LibraryLoader.load('plyrShopifyStyles');
        }

        function setupVideos(errors) {
            if (errors) {
                fallbackToNativeVideo();
                return;
            }

            loadVideos();
        }

        function createPlayer(video) {
            if (video.player) {
                return;
            }

            var productMediaWrapper = video.container.closest(
                selectors.productMediaWrapper
            );

            var enableLooping =
                productMediaWrapper.getAttribute(
                    'data-' + attributes.enableVideoLooping
                ) === 'true';

            // eslint-disable-next-line no-undef
            video.player = new Shopify.Video(video.element, {
                loop: {active: enableLooping}
            });

            var pauseVideo = function () {
                if (!video.player) return;
                video.player.pause();
            };

            productMediaWrapper.addEventListener('mediaHidden', pauseVideo);
            productMediaWrapper.addEventListener('xrLaunch', pauseVideo);

            productMediaWrapper.addEventListener('mediaVisible', function () {
                if (Helpers.isTouch()) return;
                if (!video.player) return;
                video.player.play();
            });
        }

        function hostFromVideoElement(video) {
            if (video.tagName === 'VIDEO') {
                return hosts.shopify;
            }

            return hosts.external;
        }

        function loadVideos() {
            for (var key in videos) {
                if (videos.hasOwnProperty(key)) {
                    var video = videos[key];
                    video.ready();
                }
            }
        }

        function fallbackToNativeVideo() {
            for (var key in videos) {
                if (videos.hasOwnProperty(key)) {
                    var video = videos[key];

                    if (video.nativeVideo) continue;

                    if (video.host === hosts.shopify) {
                        video.element.setAttribute('controls', 'controls');
                        video.nativeVideo = true;
                    }
                }
            }
        }

        function removeSectionVideos(sectionId) {
            for (var key in videos) {
                if (videos.hasOwnProperty(key)) {
                    var video = videos[key];

                    if (video.sectionId === sectionId) {
                        if (video.player) video.player.destroy();
                        delete videos[key];
                    }
                }
            }
        }

        return {
            init: init,
            hosts: hosts,
            loadVideos: loadVideos,
            removeSectionVideos: removeSectionVideos
        };
    })();

    var attributes = {
        imageZoomTarget: 'data-image-zoom-target'
    };

    function Zoom(container) {
        this.container = container;
        this.cache = {};
        this.url = container.dataset.zoom;

        this._cacheSelectors();

        if (!this.cache.sourceImage) return;

        this._duplicateImage();
    }

    Zoom.prototype = Object.assign({}, Zoom.prototype, {
        _cacheSelectors: function () {
            this.cache = {
                sourceImage: this.container.querySelector(selectors.imageZoom)
            };
        },

        _init: function () {
            var targetWidth = this.cache.targetImage.width;
            var targetHeight = this.cache.targetImage.height;

            if (this.cache.sourceImage === this.cache.targetImage) {
                this.sourceWidth = targetWidth;
                this.sourceHeight = targetHeight;
            } else {
                this.sourceWidth = this.cache.sourceImage.width;
                this.sourceHeight = this.cache.sourceImage.height;
            }

            this.xRatio =
                (this.cache.sourceImage.width - targetWidth) / this.sourceWidth;
            this.yRatio =
                (this.cache.sourceImage.height - targetHeight) / this.sourceHeight;
        },

        _start: function (e) {
            this._init();
            this._move(e);
        },

        _stop: function () {
            this.cache.targetImage.style.opacity = 0;
        },

        /**
         * Sets the correct coordinates top and left position in px
         * It sets a limit within between 0 and the max height of the image
         * So when the mouse leaves the target image, it could
         * never go above or beyond the target image zone
         */
        _setTopLeftMaxValues: function (top, left) {
            return {
                left: Math.max(Math.min(left, this.sourceWidth), 0),
                top: Math.max(Math.min(top, this.sourceHeight), 0)
            };
        },

        _move: function (e) {
            // get left and top position within the "source image" zone
            var left =
                e.pageX -
                (this.cache.sourceImage.getBoundingClientRect().left + window.scrollX);
            var top =
                e.pageY -
                (this.cache.sourceImage.getBoundingClientRect().top + window.scrollY);
            // make sure the left and top position don't go
            // above or beyond the target image zone
            var position = this._setTopLeftMaxValues(top, left);

            top = position.top;
            left = position.left;

            this.cache.targetImage.style.left = -(left * -this.xRatio) + 'px';
            this.cache.targetImage.style.top = -(top * -this.yRatio) + 'px';
            this.cache.targetImage.style.opacity = 1;
        },

        /**
         * This loads a high resolution image
         * via the data attributes url
         * It adds all necessary CSS styles and adds to the container
         */
        _duplicateImage: function () {
            this._loadImage()
                .then(
                    function (image) {
                        this.cache.targetImage = image;
                        image.style.width = image.width + 'px';
                        image.style.height = image.height + 'px';
                        image.style.position = 'absolute';
                        image.style.maxWidth = 'none';
                        image.style.maxHeight = 'none';
                        image.style.opacity = 0;
                        image.style.border = 'none';
                        image.style.left = 0;
                        image.style.top = 0;

                        this.container.appendChild(image);

                        this._init();

                        this._start = this._start.bind(this);
                        this._stop = this._stop.bind(this);
                        this._move = this._move.bind(this);

                        this.container.addEventListener('mouseenter', this._start);
                        this.container.addEventListener('mouseleave', this._stop);
                        this.container.addEventListener('mousemove', this._move);

                        this.container.style.position = 'relative';
                        this.container.style.overflow = 'hidden';
                    }.bind(this)
                )
                .catch(function (error) {
                    // eslint-disable-next-line no-console
                    console.warn('Error fetching image', error);
                });
        },

        _loadImage: function () {
            // eslint-disable-next-line
            return new Promise(function (resolve, reject) {
                    var image = new Image();
                    image.setAttribute('role', 'presentation');
                    image.setAttribute(attributes.imageZoomTarget, true);
                    image.classList.add(classes.zoomImg);
                    image.src = this.url;

                    image.addEventListener('load', function () {
                        resolve(image);
                    });

                    image.addEventListener('error', function (error) {
                        reject(error);
                    });
                }.bind(this)
            );
        },

        unload: function () {
            var targetImage = this.container.querySelector(
                '[' + attributes.imageZoomTarget + ']'
            );
            if (targetImage) {
                targetImage.remove();
            }

            this.container.removeEventListener('mouseenter', this._start);
            this.container.removeEventListener('mouseleave', this._stop);
            this.container.removeEventListener('mousemove', this._move);
        }
    });

    return Zoom;
})();

export default Zoom;