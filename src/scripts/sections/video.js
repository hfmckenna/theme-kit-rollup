import Helpers from '../helpers/helpers'
import * as slate from '../helpers/slate'

export const Video = (function () {
    var autoplayCheckComplete = false;
    var playOnClickChecked = false;
    var playOnClick = false;
    var youtubeLoaded = false;
    var videos = {};
    var videoPlayers = [];
    var videoOptions = {
        ratio: 16 / 9,
        scrollAnimationDuration: 400,
        playerVars: {
            // eslint-disable-next-line camelcase
            iv_load_policy: 3,
            modestbranding: 1,
            autoplay: 0,
            controls: 0,
            wmode: 'opaque',
            branding: 0,
            autohide: 0,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerChange
        }
    };
    var classes = {
        playing: 'video-is-playing',
        paused: 'video-is-paused',
        loading: 'video-is-loading',
        loaded: 'video-is-loaded',
        backgroundVideoWrapper: 'video-background-wrapper',
        videoWithImage: 'video--image_with_play',
        backgroundVideo: 'video--background',
        userPaused: 'is-paused',
        supportsAutoplay: 'autoplay',
        supportsNoAutoplay: 'no-autoplay',
        wrapperMinHeight: 'video-section-wrapper--min-height'
    };

    var selectors = {
        section: '.video-section',
        videoWrapper: '.video-section-wrapper',
        playVideoBtn: '.video-control__play',
        closeVideoBtn: '.video-control__close-wrapper',
        pauseVideoBtn: '.video__pause',
        pauseVideoStop: '.video__pause-stop',
        pauseVideoResume: '.video__pause-resume',
        fallbackText: '.icon__fallback-text'
    };

    /**
     * Public functions
     */
    function init(video) {
        if (!video) return;

        videos[video.id] = {
            id: video.id,
            videoId: video.dataset.id,
            type: video.dataset.type,
            status:
                video.dataset.type === 'image_with_play' ? 'closed' : 'background', // closed, open, background
            video: video,
            videoWrapper: video.closest(selectors.videoWrapper),
            section: video.closest(selectors.section),
            controls: video.dataset.type === 'background' ? 0 : 1
        };

        if (!youtubeLoaded) {
            // This code loads the IFrame Player API code asynchronously.
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        playOnClickCheck();
    }

    function customPlayVideo(playerId) {
        // Make sure we have carried out the playOnClick check first
        if (!playOnClickChecked && !playOnClick) {
            return;
        }

        if (playerId && typeof videoPlayers[playerId].playVideo === 'function') {
            privatePlayVideo(playerId);
        }
    }

    function pauseVideo(playerId) {
        if (
            videoPlayers[playerId] &&
            typeof videoPlayers[playerId].pauseVideo === 'function'
        ) {
            videoPlayers[playerId].pauseVideo();
        }
    }

    function loadVideos() {
        for (var key in videos) {
            if (videos.hasOwnProperty(key)) {
                createPlayer(key);
            }
        }

        initEvents();
        youtubeLoaded = true;
    }

    function editorLoadVideo(key) {
        if (!youtubeLoaded) {
            return;
        }
        createPlayer(key);

        initEvents();
    }

    /**
     * Private functions
     */

    function privatePlayVideo(id, clicked) {
        var videoData = videos[id];
        var player = videoPlayers[id];
        var videoWrapper = videoData.videoWrapper;

        if (playOnClick) {
            // playOnClick means we are probably on mobile (no autoplay).
            // setAsPlaying will show the iframe, requiring another click
            // to play the video.
            setAsPlaying(videoData);
        } else if (clicked || autoplayCheckComplete) {
            // Play if autoplay is available or clicked to play
            videoWrapper.classList.remove(classes.loading);
            setAsPlaying(videoData);
            player.playVideo();
            return;
        } else {
            player.playVideo();
        }
    }

    function setAutoplaySupport(supported) {
        var supportClass = supported
            ? classes.supportsAutoplay
            : classes.supportsNoAutoplay;
        document.documentElement.classList.remove(
            classes.supportsAutoplay,
            classes.supportsNoAutoplay
        );
        document.documentElement.classList.add(supportClass);

        if (!supported) {
            playOnClick = true;
        }

        autoplayCheckComplete = true;
    }

    function playOnClickCheck() {
        if (playOnClickChecked) {
            return;
        }

        if (isMobile()) {
            playOnClick = true;
        }

        if (playOnClick) {
            // No need to also do the autoplay check
            setAutoplaySupport(false);
        }

        playOnClickChecked = true;
    }

    // The API will call this function when each video player is ready
    function onPlayerReady(evt) {
        evt.target.setPlaybackQuality('hd1080');
        var videoData = getVideoOptions(evt);
        var videoTitle = evt.target.getVideoData().title;
        playOnClickCheck();

        // Prevent tabbing through YouTube player controls until visible
        document.getElementById(videoData.id).setAttribute('tabindex', '-1');

        sizeBackgroundVideos();
        setButtonLabels(videoData.videoWrapper, videoTitle);

        // Customize based on options from the video ID
        if (videoData.type === 'background') {
            evt.target.mute();
            privatePlayVideo(videoData.id);
        }

        videoData.videoWrapper.classList.add(classes.loaded);
    }

    function onPlayerChange(evt) {
        var videoData = getVideoOptions(evt);
        if (
            videoData.status === 'background' &&
            !isMobile() &&
            !autoplayCheckComplete &&
            (evt.data === YT.PlayerState.PLAYING ||
                evt.data === YT.PlayerState.BUFFERING)
        ) {
            setAutoplaySupport(true);
            autoplayCheckComplete = true;
            videoData.videoWrapper.classList.remove(classes.loading);
        }
        switch (evt.data) {
            case YT.PlayerState.ENDED:
                setAsFinished(videoData);
                break;
            case YT.PlayerState.PAUSED:
                // Seeking on a YouTube video also fires a PAUSED state change,
                // checking the state after a delay prevents us pausing the video when
                // the user is seeking instead of pausing
                setTimeout(function () {
                    if (evt.target.getPlayerState() === YT.PlayerState.PAUSED) {
                        setAsPaused(videoData);
                    }
                }, 200);
                break;
        }
    }

    function setAsFinished(videoData) {
        switch (videoData.type) {
            case 'background':
                videoPlayers[videoData.id].seekTo(0);
                break;
            case 'image_with_play':
                closeVideo(videoData.id);
                toggleExpandVideo(videoData.id, false);
                break;
        }
    }

    function setAsPlaying(videoData) {
        var videoWrapper = videoData.videoWrapper;
        var pauseButton = videoWrapper.querySelector(selectors.pauseVideoBtn);

        videoWrapper.classList.remove(classes.loading);

        if (pauseButton.classList.contains(classes.userPaused)) {
            pauseButton.classList.remove(classes.userPaused);
        }

        // Do not change element visibility if it is a background video
        if (videoData.status === 'background') {
            return;
        }

        document.getElementById(videoData.id).setAttribute('tabindex', '0');

        if (videoData.type === 'image_with_play') {
            videoWrapper.classList.remove(classes.paused);
            videoWrapper.classList.add(classes.playing);
        }

        // Update focus to the close button so we stay within the video wrapper,
        // allowing time for the scroll animation
        setTimeout(function () {
            videoWrapper.querySelector(selectors.closeVideoBtn).focus();
        }, videoOptions.scrollAnimationDuration);
    }

    function setAsPaused(videoData) {
        var videoWrapper = videoData.videoWrapper;

        // YT's events fire after our click event. This status flag ensures
        // we don't interact with a closed or background video.
        if (videoData.type === 'image_with_play') {
            if (videoData.status === 'closed') {
                videoWrapper.classList.remove(classes.paused);
            } else {
                videoWrapper.classList.add(classes.paused);
            }
        }

        videoWrapper.classList.remove(classes.playing);
    }

    function closeVideo(playerId) {
        var videoData = videos[playerId];
        var videoWrapper = videoData.videoWrapper;

        document.getElementById(videoData.id).setAttribute('tabindex', '-1');

        videoData.status = 'closed';

        switch (videoData.type) {
            case 'image_with_play':
                videoPlayers[playerId].stopVideo();
                setAsPaused(videoData); // in case the video is already paused
                break;
            case 'background':
                videoPlayers[playerId].mute();
                setBackgroundVideo(playerId);
                break;
        }

        videoWrapper.classList.remove(classes.paused, classes.playing);
    }

    function getVideoOptions(evt) {
        var id = evt.target.getIframe().id;
        return videos[id];
    }

    function toggleExpandVideo(playerId, expand) {
        var video = videos[playerId];
        var elementTop =
            video.videoWrapper.getBoundingClientRect().top + window.pageYOffset;
        var playButton = video.videoWrapper.querySelector(selectors.playVideoBtn);
        var offset = 0;
        var newHeight = 0;

        if (isMobile()) {
            video.videoWrapper.parentElement.classList.toggle('page-width', !expand);
        }

        if (expand) {
            if (isMobile()) {
                newHeight = window.innerWidth / videoOptions.ratio;
            } else {
                newHeight = video.videoWrapper.offsetWidth / videoOptions.ratio;
            }
            offset = (window.innerHeight - newHeight) / 2;

            video.videoWrapper.style.height =
                video.videoWrapper.getBoundingClientRect().height + 'px';
            video.videoWrapper.classList.remove(classes.wrapperMinHeight);
            video.videoWrapper.style.height = newHeight + 'px';

            // Animate doesn't work in mobile editor, so we don't use it
            if (!(isMobile() && Shopify.designMode)) {
                var scrollBehavior = document.documentElement.style.scrollBehavior;
                document.documentElement.style.scrollBehavior = 'smooth';
                window.scrollTo({top: elementTop - offset});
                document.documentElement.style.scrollBehavior = scrollBehavior;
            }
        } else {
            if (isMobile()) {
                newHeight = video.videoWrapper.dataset.mobileHeight;
            } else {
                newHeight = video.videoWrapper.dataset.desktopHeight;
            }

            video.videoWrapper.style.height = newHeight + 'px';

            setTimeout(function () {
                video.videoWrapper.classList.add(classes.wrapperMinHeight);
            }, 600);
            // Set focus on play button, but don't scroll page
            var x = window.scrollX;
            var y = window.scrollY;
            playButton.focus();
            window.scrollTo(x, y);
        }
    }

    function togglePause(playerId) {
        var pauseButton = videos[playerId].videoWrapper.querySelector(
            selectors.pauseVideoBtn
        );
        var paused = pauseButton.classList.contains(classes.userPaused);
        if (paused) {
            pauseButton.classList.remove(classes.userPaused);
            customPlayVideo(playerId);
        } else {
            pauseButton.classList.add(classes.userPaused);
            pauseVideo(playerId);
        }
        pauseButton.setAttribute('aria-pressed', !paused);
    }

    function startVideoOnClick(playerId) {
        var video = videos[playerId];

        // add loading class to wrapper
        video.videoWrapper.classList.add(classes.loading);

        // Explicity set the video wrapper height (needed for height transition)
        video.videoWrapper.style.height = video.videoWrapper.offsetHeight + 'px';

        video.status = 'open';

        switch (video.type) {
            case 'image_with_play':
                privatePlayVideo(playerId, true);
                break;
            case 'background':
                unsetBackgroundVideo(playerId, video);
                videoPlayers[playerId].unMute();
                privatePlayVideo(playerId, true);
                break;
        }

        toggleExpandVideo(playerId, true);

        // esc to close video player
        document.addEventListener('keydown', handleVideoPlayerKeydown);
    }

    var handleVideoPlayerKeydown = function (evt) {
        var playerId = document.activeElement.dataset.controls;
        if (evt.keyCode !== slate.utils.keyboardKeys.ESCAPE || !playerId) {
            return;
        }

        closeVideo(playerId);
        toggleExpandVideo(playerId, false);
    };

    function sizeBackgroundVideos() {
        var backgroundVideos = document.querySelectorAll(
            '.' + classes.backgroundVideo
        );
        backgroundVideos.forEach(function (el) {
            sizeBackgroundVideo(el);
        });
    }

    function sizeBackgroundVideo(videoPlayer) {
        if (!youtubeLoaded) {
            return;
        }

        if (isMobile()) {
            videoPlayer.style.cssText = null;
        } else {
            var videoWrapper = videoPlayer.closest(selectors.videoWrapper);
            var videoWidth = videoWrapper.clientWidth;
            var playerWidth = videoPlayer.clientWidth;
            var desktopHeight = videoWrapper.dataset.desktopHeight;

            // when screen aspect ratio differs from video, video must center and underlay one dimension
            if (videoWidth / videoOptions.ratio < desktopHeight) {
                playerWidth = Math.ceil(desktopHeight * videoOptions.ratio); // get new player width
                var styles =
                    'width: ' +
                    playerWidth +
                    'px; height: ' +
                    desktopHeight +
                    'px; left: ' +
                    (videoWidth - playerWidth) / 2 +
                    'px; top: 0;';
                videoPlayer.style.cssText = styles;
            } else {
                // new video width < window width (gap to right)
                desktopHeight = Math.ceil(videoWidth / videoOptions.ratio); // get new player height
                var styles2 =
                    'width: ' +
                    videoWidth +
                    'px; height: ' +
                    desktopHeight +
                    'px; top: ' +
                    (desktopHeight - desktopHeight) / 2 +
                    'px; left: 0;'; // player height is greater, offset top; reset left
                videoPlayer.style.cssText = styles2;
            }

            Helpers.prepareTransition(videoPlayer);
            videoWrapper.classList.add(classes.loaded);
        }
    }

    function unsetBackgroundVideo(playerId) {
        // Switch the background video to a chrome-only player once played
        var player = document.getElementById(playerId);
        player.classList.remove(classes.backgroundVideo);
        player.classList.add(classes.videoWithImage);

        setTimeout(function () {
            document.getElementById(playerId).style.cssText = null;
        }, 600);

        videos[playerId].videoWrapper.classList.remove(
            classes.backgroundVideoWrapper
        );
        videos[playerId].videoWrapper.classList.add(classes.playing);

        videos[playerId].status = 'open';
    }

    function setBackgroundVideo(playerId) {
        var player = document.getElementById(playerId);
        player.classList.remove(classes.videoWithImage);
        player.classList.add(classes.backgroundVideo);

        videos[playerId].videoWrapper.classList.add(classes.backgroundVideoWrapper);

        videos[playerId].status = 'background';
        sizeBackgroundVideo(player);
    }

    function isMobile() {
        return window.innerWidth < theme.breakpoints.medium;
    }

    var handleWindowResize = Helpers.debounce(function () {
        if (!youtubeLoaded) return;
        var key;
        var fullscreen = window.innerHeight === screen.height;
        sizeBackgroundVideos();

        if (isMobile()) {
            for (key in videos) {
                if (videos.hasOwnProperty(key)) {
                    if (videos[key].videoWrapper.classList.contains(classes.playing)) {
                        if (!fullscreen) {
                            pauseVideo(key);
                            setAsPaused(videos[key]);
                        }
                    }
                    videos[key].videoWrapper.style.height =
                        document.documentElement.clientWidth / videoOptions.ratio + 'px';
                }
            }
            setAutoplaySupport(false);
        } else {
            setAutoplaySupport(true);
            for (key in videos) {
                var videosWithImage = videos[key].videoWrapper.querySelectorAll(
                    '.' + classes.videoWithImage
                );
                if (videosWithImage.length) {
                    continue;
                }
                videoPlayers[key].playVideo();
                setAsPlaying(videos[key]);
            }
        }
    }, 200);

    var handleWindowScroll = Helpers.debounce(function () {
        if (!youtubeLoaded) return;

        for (var key in videos) {
            if (videos.hasOwnProperty(key)) {
                var videoWrapper = videos[key].videoWrapper;
                var condition =
                    videoWrapper.getBoundingClientRect().top +
                    window.pageYOffset +
                    videoWrapper.offsetHeight * 0.75 <
                    window.pageYOffset ||
                    videoWrapper.getBoundingClientRect().top +
                    window.pageYOffset +
                    videoWrapper.offsetHeight * 0.25 >
                    window.pageYOffset + window.innerHeight;

                // Close the video if more than 75% of it is scrolled out of view
                if (videoWrapper.classList.contains(classes.playing)) {
                    if (!condition) return;
                    closeVideo(key);
                    toggleExpandVideo(key, false);
                }
            }
        }
    }, 50);

    function initEvents() {
        var playVideoBtns = document.querySelectorAll(selectors.playVideoBtn);
        var closeVideoBtns = document.querySelectorAll(selectors.closeVideoBtn);
        var pauseVideoBtns = document.querySelectorAll(selectors.pauseVideoBtn);

        playVideoBtns.forEach(function (btn) {
            btn.addEventListener('click', function (evt) {
                var playerId = evt.currentTarget.dataset.controls;
                startVideoOnClick(playerId);
            });
        });

        closeVideoBtns.forEach(function (btn) {
            btn.addEventListener('click', function (evt) {
                var playerId = evt.currentTarget.dataset.controls;

                evt.currentTarget.blur();
                closeVideo(playerId);
                toggleExpandVideo(playerId, false);
            });
        });

        pauseVideoBtns.forEach(function (btn) {
            btn.addEventListener('click', function (evt) {
                var playerId = evt.currentTarget.dataset.controls;
                togglePause(playerId);
            });
        });

        // Listen to resize to keep a background-size:cover-like layout
        window.addEventListener('resize', handleWindowResize);

        window.addEventListener('scroll', handleWindowScroll);
    }

    function createPlayer(key) {
        var args = Object.assign(videoOptions, videos[key]);

        args.playerVars.controls = args.controls;
        videoPlayers[key] = new YT.Player(key, args);
    }

    function removeEvents() {
        document.removeEventListener('keydown', handleVideoPlayerKeydown);
        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('scroll', handleWindowScroll);
    }

    function setButtonLabels(videoWrapper, title) {
        var playButtons = videoWrapper.querySelectorAll(selectors.playVideoBtn);
        var closeButton = videoWrapper.querySelector(selectors.closeVideoBtn);
        var pauseButton = videoWrapper.querySelector(selectors.pauseVideoBtn);
        var closeButtonText = closeButton.querySelector(selectors.fallbackText);

        var pauseButtonStop = pauseButton.querySelector(selectors.pauseVideoStop);
        var pauseButtonStopText = pauseButtonStop.querySelector(
            selectors.fallbackText
        );

        var pauseButtonResume = pauseButton.querySelector(
            selectors.pauseVideoResume
        );
        var pauseButtonResumeText = pauseButtonResume.querySelector(
            selectors.fallbackText
        );

        // Insert the video title retrieved from YouTube into the instructional text
        // for each button
        playButtons.forEach(function (playButton) {
            var playButtonText = playButton.querySelector(selectors.fallbackText);

            playButtonText.textContent = playButtonText.textContent.replace(
                '[video_title]',
                title
            );
        });
        closeButtonText.textContent = closeButtonText.textContent.replace(
            '[video_title]',
            title
        );
        pauseButtonStopText.textContent = pauseButtonStopText.textContent.replace(
            '[video_title]',
            title
        );
        pauseButtonResumeText.textContent = pauseButtonResumeText.textContent.replace(
            '[video_title]',
            title
        );
    }

    return {
        init: init,
        editorLoadVideo: editorLoadVideo,
        loadVideos: loadVideos,
        playVideo: customPlayVideo,
        pauseVideo: pauseVideo,
        removeEvents: removeEvents
    };
})();

export const VideoSection = function () {
    this.onLoad = function() {
        this.container.querySelectorAll('.video').forEach(function (el) {
            Video.init(el);
            Video.editorLoadVideo(el.id);
        })
    }
    this.onUnload = function () {
        Video.removeEvents();
    }
};