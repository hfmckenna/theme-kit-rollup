import Helpers from '../helpers/helpers'
import MobileNav from '../global/mobilenav'
import Drawers from '../global/drawers'

const SearchDrawer = (function () {
    var selectors = {
        headerSection: '[data-header-section]',
        drawer: '[data-predictive-search-drawer]',
        drawerOpenButton: '[data-predictive-search-open-drawer]',
        headerSearchInput: '[data-predictive-search-drawer-input]',
        predictiveSearchWrapper: '[data-predictive-search-mount="drawer"]'
    };

    var drawerInstance;

    function init() {
        setAccessibilityProps();

        drawerInstance = new Drawers('SearchDrawer', 'top', {
            onDrawerOpen: function () {
                setHeight();
                MobileNav.closeMobileNav();
                lockBodyScroll();
            },
            onDrawerClose: function () {
                theme.SearchHeader.clearAndClose();
                var drawerOpenButton = document.querySelector(
                    selectors.drawerOpenButton
                );

                if (drawerOpenButton) drawerOpenButton.focus();

                unlockBodyScroll();
            },
            withPredictiveSearch: true,
            elementToFocusOnOpen: document.querySelector(selectors.headerSearchInput)
        });
    }

    function setAccessibilityProps() {
        var drawerOpenButton = document.querySelector(selectors.drawerOpenButton);

        if (drawerOpenButton) {
            drawerOpenButton.setAttribute('aria-controls', 'SearchDrawer');
            drawerOpenButton.setAttribute('aria-expanded', 'false');
            drawerOpenButton.setAttribute('aria-controls', 'dialog');
        }
    }

    function setHeight() {
        var searchDrawer = document.querySelector(selectors.drawer);
        var headerHeight = document.querySelector(selectors.headerSection)
            .offsetHeight;

        searchDrawer.style.height = headerHeight + 'px';
    }

    function close() {
        drawerInstance.close();
    }

    function lockBodyScroll() {
        Helpers.enableScrollLock();
    }

    function unlockBodyScroll() {
        Helpers.disableScrollLock();
    }

    return {
        init: init,
        close: close
    };
})();

export default SearchDrawer;