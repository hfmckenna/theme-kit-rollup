import Helpers from '../helpers/helpers'
import {utils} from '../helpers/slate'

const Filters = (function () {
    function Filters() {
        this.onLoad = function () {
            var settings = {
                mediaQueryMediumUp: '(min-width: ' + theme.breakpoints.medium + 'px)'
            };

            var selectors = {
                filterSelection: '#FilterTags',
                sortSelection: '#SortBy',
                selectInput: '[data-select-input]'
            };

            this.filterSelect = this.container.querySelector(selectors.filterSelection);
            this.sortSelect = this.container.querySelector(selectors.sortSelection);

            this.selects = document.querySelectorAll(selectors.selectInput);

            if (this.sortSelect) {
                this.defaultSort = this._getDefaultSortValue();
            }

            if (this.selects.length) {
                this.selects.forEach(function (select) {
                    select.classList.remove('hidden');
                });
            }

            this.initBreakpoints = this._initBreakpoints.bind(this);

            this.mql = window.matchMedia(settings.mediaQueryMediumUp);
            this.mql.addListener(this.initBreakpoints);

            if (this.filterSelect) {
                this.filterSelect.addEventListener(
                    'change',
                    this._onFilterChange.bind(this)
                );
            }

            if (this.sortSelect) {
                this.sortSelect.addEventListener('change', this._onSortChange.bind(this));
            }

            Helpers.promiseStylesheet().then(
                function () {
                    this._initBreakpoints();
                }.bind(this)
            );

            this._initParams();
        }

        this._initBreakpoints = function () {
            if (this.mql.matches) {
                utils.resizeSelects(this.selects);
            }
        }

        this._initParams = function () {
            this.queryParams = {};
            if (location.search.length) {
                var aKeyValue;
                var aCouples = location.search.substr(1).split('&');
                for (var i = 0; i < aCouples.length; i++) {
                    aKeyValue = aCouples[i].split('=');
                    if (aKeyValue.length > 1) {
                        this.queryParams[
                            decodeURIComponent(aKeyValue[0])
                            ] = decodeURIComponent(aKeyValue[1]);
                    }
                }
            }
        }

        this._onSortChange = function () {
            this.queryParams.sort_by = this._getSortValue();

            if (this.queryParams.page) {
                delete this.queryParams.page;
            }

            window.location.search = decodeURIComponent(
                new URLSearchParams(Object.entries(this.queryParams)).toString()
            );
        }

        this._onFilterChange = function () {
            document.location.href = this._getFilterValue();
        }

        this._getFilterValue = function () {
            return this.filterSelect.value;
        }

        this._getSortValue = function () {
            return this.sortSelect.value || this.defaultSort;
        }

        this._getDefaultSortValue = function () {
            return this.sortSelect.dataset.defaultSortby;
        }

        this.onUnload = function () {
            if (this.filterSelect) {
                this.filterSelect.removeEventListener('change', this._onFilterChange);
            }

            if (this.sortSelect) {
                this.sortSelect.removeEventListener('change', this._onSortChange);
            }

            this.mql.removeListener(this.initBreakpoints);
        }
    }
    return Filters;
})();

export default Filters;