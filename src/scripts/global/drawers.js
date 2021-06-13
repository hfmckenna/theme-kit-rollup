import {a11y} from '../helpers/slate'

/* ================ GLOBAL ================ */
/*============================================================================
  Drawer modules
==============================================================================*/
const Drawers = (function () {
    function Drawer(id, position, options) {
        var DEFAULT_OPEN_CLASS = 'js-drawer-open';
        var DEFAULT_CLOSE_CLASS = 'js-drawer-close';

        var defaults = {
            selectors: {
                openVariant: '.' + DEFAULT_OPEN_CLASS + '-' + position,
                close: '.' + DEFAULT_CLOSE_CLASS
            },
            classes: {
                open: DEFAULT_OPEN_CLASS,
                openVariant: DEFAULT_OPEN_CLASS + '-' + position
            },
            withPredictiveSearch: false
        };

        this.nodes = {
            parents: [document.documentElement, document.body],
            page: document.getElementById('PageContainer')
        };

        this.eventHandlers = {};

        this.config = Object.assign({}, defaults, options);
        this.position = position;
        this.drawer = document.getElementById(id);

        if (!this.drawer) {
            return false;
        }

        this.drawerIsOpen = false;
        this.init();
    }

    Drawer.prototype.init = function () {
        document
            .querySelector(this.config.selectors.openVariant)
            .addEventListener('click', this.open.bind(this));
        this.drawer
            .querySelector(this.config.selectors.close)
            .addEventListener('click', this.close.bind(this));
    };

    Drawer.prototype.open = function (evt) {
        // Keep track if drawer was opened from a click, or called by another function
        var externalCall = false;

        // Prevent following href if link is clicked
        if (evt) {
            evt.preventDefault();
        } else {
            externalCall = true;
        }

        // Without this, the drawer opens, the click event bubbles up to nodes.page
        // which closes the drawer.
        if (evt && evt.stopPropagation) {
            evt.stopPropagation();
            // save the source of the click, we'll focus to this on close
            this.activeSource = evt.currentTarget;
        }

        if (this.drawerIsOpen && !externalCall) {
            return this.close();
        }

        // Add is-transitioning class to moved elements on open so drawer can have
        // transition for close animation
        if (!this.config.withPredictiveSearch) {
            theme.Helpers.prepareTransition(this.drawer);
        }

        this.nodes.parents.forEach(
            function (parent) {
                parent.classList.add(
                    this.config.classes.open,
                    this.config.classes.openVariant
                );
            }.bind(this)
        );

        this.drawerIsOpen = true;

        // Run function when draw opens if set
        if (
            this.config.onDrawerOpen &&
            typeof this.config.onDrawerOpen === 'function'
        ) {
            if (!externalCall) {
                this.config.onDrawerOpen();
            }
        }

        if (this.activeSource && this.activeSource.hasAttribute('aria-expanded')) {
            this.activeSource.setAttribute('aria-expanded', 'true');
        }

        // Set focus on drawer
        var trapFocusConfig = {
            container: this.drawer
        };

        if (this.config.elementToFocusOnOpen) {
            trapFocusConfig.elementToFocus = this.config.elementToFocusOnOpen;
        }

        a11y.trapFocus(trapFocusConfig);

        this.bindEvents();

        return this;
    };

    Drawer.prototype.close = function () {
        if (!this.drawerIsOpen) {
            // don't close a closed drawer
            return;
        }

        // deselect any focused form elements
        document.activeElement.dispatchEvent(
            new CustomEvent('blur', {bubbles: true, cancelable: true})
        );

        // Ensure closing transition is applied to moved elements, like the nav
        if (!this.config.withPredictiveSearch) {
            theme.Helpers.prepareTransition(this.drawer);
        }

        this.nodes.parents.forEach(
            function (parent) {
                parent.classList.remove(
                    this.config.classes.open,
                    this.config.classes.openVariant
                );
            }.bind(this)
        );

        if (this.activeSource && this.activeSource.hasAttribute('aria-expanded')) {
            this.activeSource.setAttribute('aria-expanded', 'false');
        }

        this.drawerIsOpen = false;

        // Remove focus on drawer
        a11y.removeTrapFocus({
            container: this.drawer
        });

        this.unbindEvents();

        // Run function when draw closes if set
        if (
            this.config.onDrawerClose &&
            typeof this.config.onDrawerClose === 'function'
        ) {
            this.config.onDrawerClose();
        }
    };

    Drawer.prototype.bindEvents = function () {
        this.eventHandlers.drawerKeyupHandler = function (evt) {
            // close on 'esc' keypress
            if (evt.keyCode === 27) {
                this.close();
                return false;
            } else {
                return true;
            }
        }.bind(this);

        this.eventHandlers.drawerTouchmoveHandler = function () {
            return false;
        };

        this.eventHandlers.drawerClickHandler = function () {
            this.close();
            return false;
        }.bind(this);

        // Add event listener to document body
        document.body.addEventListener(
            'keyup',
            this.eventHandlers.drawerKeyupHandler
        );

        // Lock scrolling on mobile
        this.nodes.page.addEventListener(
            'touchmove',
            this.eventHandlers.drawerTouchmoveHandler
        );

        this.nodes.page.addEventListener(
            'click',
            this.eventHandlers.drawerClickHandler
        );
    };

    Drawer.prototype.unbindEvents = function () {
        this.nodes.page.removeEventListener(
            'touchmove',
            this.eventHandlers.drawerTouchmoveHandler
        );
        this.nodes.page.removeEventListener(
            'click',
            this.eventHandlers.drawerClickHandler
        );
        document.body.removeEventListener(
            'keyup',
            this.eventHandlers.drawerKeyupHandler
        );
    };

    return Drawer;
})();

export default Drawers;