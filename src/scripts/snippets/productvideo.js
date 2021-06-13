import Helpers from "../helpers/helpers";

const ProductVideo = (function () {
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

export default ProductVideo;