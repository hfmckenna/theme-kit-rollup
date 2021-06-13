import Disclosure from "../snippets/disclosure";

const FooterSection = (function () {
    function FooterSection() {
        var selectors = {
            disclosureLocale: '[data-disclosure-locale]',
            disclosureCurrency: '[data-disclosure-currency]'
        };

        this.onLoad = function () {
            this.cache = {};
            this.cacheSelectors();

            if (this.cache.localeDisclosure) {
                this.localeDisclosure = new Disclosure(this.cache.localeDisclosure);
            }

            if (this.cache.currencyDisclosure) {
                this.currencyDisclosure = new Disclosure(
                    this.cache.currencyDisclosure
                );
            }
        }

        this.cacheSelectors = function () {
            this.cache = {
                localeDisclosure: this.container.querySelector(
                    selectors.disclosureLocale
                ),
                currencyDisclosure: this.container.querySelector(
                    selectors.disclosureCurrency
                )
            };
        }

        this.onUnload = function () {
            if (this.cache.localeDisclosure) {
                this.localeDisclosure.destroy();
            }

            if (this.cache.currencyDisclosure) {
                this.currencyDisclosure.destroy();
            }
        }
    }

    return FooterSection;
})();

export default FooterSection;