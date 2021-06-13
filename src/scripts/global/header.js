import Helpers from "../helpers/helpers";

const Header = (function () {
    var selectors = {
        body: 'body',
        navigation: '#AccessibleNav',
        siteNavHasDropdown: '[data-has-dropdowns]',
        siteNavChildLinks: '.site-nav__child-link',
        siteNavActiveDropdown: '.site-nav--active-dropdown',
        siteNavHasCenteredDropdown: '.site-nav--has-centered-dropdown',
        siteNavCenteredDropdown: '.site-nav__dropdown--centered',
        siteNavLinkMain: '.site-nav__link--main',
        siteNavChildLink: '.site-nav__link--last',
        siteNavDropdown: '.site-nav__dropdown',
        siteHeader: '.site-header'
    };

    var config = {
        activeClass: 'site-nav--active-dropdown',
        childLinkClass: 'site-nav__child-link',
        rightDropdownClass: 'site-nav__dropdown--right',
        leftDropdownClass: 'site-nav__dropdown--left'
    };

    var cache = {};

    function init() {
        cacheSelectors();
        styleDropdowns(document.querySelectorAll(selectors.siteNavHasDropdown));
        positionFullWidthDropdowns();

        cache.parents.forEach(function (element) {
            element.addEventListener('click', submenuParentClickHandler);
        });

        // check when we're leaving a dropdown and close the active dropdown
        cache.siteNavChildLink.forEach(function (element) {
            element.addEventListener('focusout', submenuFocusoutHandler);
        });

        cache.topLevel.forEach(function (element) {
            element.addEventListener('focus', hideDropdown);
        });

        cache.subMenuLinks.forEach(function (element) {
            element.addEventListener('click', stopImmediatePropagation);
        });

        window.addEventListener('resize', resizeHandler);
    }

    function stopImmediatePropagation(event) {
        event.stopImmediatePropagation();
    }

    function cacheSelectors() {
        var navigation = document.querySelector(selectors.navigation);

        cache = {
            nav: navigation,
            topLevel: document.querySelectorAll(selectors.siteNavLinkMain),
            parents: navigation.querySelectorAll(selectors.siteNavHasDropdown),
            subMenuLinks: document.querySelectorAll(selectors.siteNavChildLinks),
            activeDropdown: document.querySelector(selectors.siteNavActiveDropdown),
            siteHeader: document.querySelector(selectors.siteHeader),
            siteNavChildLink: document.querySelectorAll(selectors.siteNavChildLink)
        };
    }

    function showDropdown(element) {
        element.classList.add(config.activeClass);

        if (cache.activeDropdown) hideDropdown();

        cache.activeDropdown = element;

        element
            .querySelector(selectors.siteNavLinkMain)
            .setAttribute('aria-expanded', 'true');

        setTimeout(function () {
            window.addEventListener('keyup', keyUpHandler);
            document.body.addEventListener('click', hideDropdown);
        }, 250);
    }

    function hideDropdown() {
        if (!cache.activeDropdown) return;

        cache.activeDropdown
            .querySelector(selectors.siteNavLinkMain)
            .setAttribute('aria-expanded', 'false');
        cache.activeDropdown.classList.remove(config.activeClass);

        cache.activeDropdown = document.querySelector(
            selectors.siteNavActiveDropdown
        );

        window.removeEventListener('keyup', keyUpHandler);
        document.body.removeEventListener('click', hideDropdown);
    }

    function styleDropdowns(dropdownListItems) {
        dropdownListItems.forEach(function (item) {
            var dropdownLi = item.querySelector(selectors.siteNavDropdown);

            if (!dropdownLi) return;

            if (isRightOfLogo(item)) {
                dropdownLi.classList.remove(config.leftDropdownClass);
                dropdownLi.classList.add(config.rightDropdownClass);
            } else {
                dropdownLi.classList.remove(config.rightDropdownClass);
                dropdownLi.classList.add(config.leftDropdownClass);
            }
        });
    }

    function isRightOfLogo(item) {
        var rect = item.getBoundingClientRect();
        var win = item.ownerDocument.defaultView;
        var leftOffset = rect.left + win.pageXOffset;

        var headerWidth = Math.floor(cache.siteHeader.offsetWidth) / 2;
        return leftOffset > headerWidth;
    }

    function positionFullWidthDropdowns() {
        document
            .querySelectorAll(selectors.siteNavHasCenteredDropdown)
            .forEach(function (el) {
                var fullWidthDropdown = el.querySelector(
                    selectors.siteNavCenteredDropdown
                );

                var fullWidthDropdownOffset = el.offsetTop + 41;
                fullWidthDropdown.style.top = fullWidthDropdownOffset + 'px';
            });
    }

    function keyUpHandler(event) {
        if (event.keyCode === 27) hideDropdown();
    }

    function resizeHandler() {
        adjustStyleAndPosition();
    }

    function submenuParentClickHandler(event) {
        var element = event.currentTarget;

        element.classList.contains(config.activeClass)
            ? hideDropdown()
            : showDropdown(element);
    }

    function submenuFocusoutHandler() {
        setTimeout(function () {
            if (
                document.activeElement.classList.contains(config.childLinkClass) ||
                !cache.activeDropdown
            ) {
                return;
            }

            hideDropdown();
        });
    }

    var adjustStyleAndPosition = Helpers.debounce(function () {
        styleDropdowns(document.querySelectorAll(selectors.siteNavHasDropdown));
        positionFullWidthDropdowns();
    }, 50);

    function unload() {
        cache.topLevel.forEach(function (element) {
            element.removeEventListener('focus', hideDropdown);
        });

        cache.subMenuLinks.forEach(function (element) {
            element.removeEventListener('click', stopImmediatePropagation);
        });

        cache.parents.forEach(function (element) {
            element.removeEventListener('click', submenuParentClickHandler);
        });

        cache.siteNavChildLink.forEach(function (element) {
            element.removeEventListener('focusout', submenuFocusoutHandler);
        });

        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('keyup', keyUpHandler);
        document.body.removeEventListener('click', hideDropdown);
    }

    return {
        init: init,
        unload: unload
    };
})();

export default Header;