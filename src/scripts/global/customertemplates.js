const customerTemplates = (function () {
    var selectors = {
        RecoverHeading: '#RecoverHeading',
        RecoverEmail: '#RecoverEmail',
        LoginHeading: '#LoginHeading'
    };

    function initEventListeners() {
        this.recoverHeading = document.querySelector(selectors.RecoverHeading);
        this.recoverEmail = document.querySelector(selectors.RecoverEmail);
        this.loginHeading = document.querySelector(selectors.LoginHeading);
        var recoverPassword = document.getElementById('RecoverPassword');
        var hideRecoverPasswordLink = document.getElementById(
            'HideRecoverPasswordLink'
        );

        // Show reset password form
        if (recoverPassword) {
            recoverPassword.addEventListener(
                'click',
                function (evt) {
                    evt.preventDefault();
                    showRecoverPasswordForm();
                    this.recoverHeading.setAttribute('tabindex', '-1');
                    this.recoverHeading.focus();
                }.bind(this)
            );
        }

        // Hide reset password form
        if (hideRecoverPasswordLink) {
            hideRecoverPasswordLink.addEventListener(
                'click',
                function (evt) {
                    evt.preventDefault();
                    hideRecoverPasswordForm();
                    this.loginHeading.setAttribute('tabindex', '-1');
                    this.loginHeading.focus();
                }.bind(this)
            );
        }

        if (this.recoverHeading) {
            this.recoverHeading.addEventListener('blur', function (evt) {
                evt.target.removeAttribute('tabindex');
            });
        }

        if (this.loginHeading) {
            this.loginHeading.addEventListener('blur', function (evt) {
                evt.target.removeAttribute('tabindex');
            });
        }
    }

    /**
     *
     *  Show/Hide recover password form
     *
     */

    function showRecoverPasswordForm() {
        document.getElementById('RecoverPasswordForm').classList.remove('hide');
        document.getElementById('CustomerLoginForm').classList.add('hide');

        if (this.recoverEmail.getAttribute('aria-invalid') === 'true') {
            this.recoverEmail.focus();
        }
    }

    function hideRecoverPasswordForm() {
        document.getElementById('RecoverPasswordForm').classList.add('hide');
        document.getElementById('CustomerLoginForm').classList.remove('hide');
    }

    /**
     *
     *  Show reset password success message
     *
     */
    function resetPasswordSuccess() {
        var formState = document.querySelector('.reset-password-success');

        // check if reset password form was successfully submited.
        if (!formState) {
            return;
        }

        // show success message
        var resetSuccess = document.getElementById('ResetSuccess');
        resetSuccess.classList.remove('hide');
        resetSuccess.focus();
    }

    /**
     *
     *  Show/hide customer address forms
     *
     */
    function customerAddressForm() {
        var newAddressForm = document.getElementById('AddressNewForm');
        var newAddressFormButton = document.getElementById('AddressNewButton');

        if (!newAddressForm) {
            return;
        }

        // Initialize observers on address selectors, defined in shopify_common.js
        if (Shopify) {
            // eslint-disable-next-line no-new
            new Shopify.CountryProvinceSelector(
                'AddressCountryNew',
                'AddressProvinceNew',
                {
                    hideElement: 'AddressProvinceContainerNew'
                }
            );
        }

        // Initialize each edit form's country/province selector
        document
            .querySelectorAll('.address-country-option')
            .forEach(function (option) {
                var formId = option.dataset.formId;
                var countrySelector = 'AddressCountry_' + formId;
                var provinceSelector = 'AddressProvince_' + formId;
                var containerSelector = 'AddressProvinceContainer_' + formId;

                // eslint-disable-next-line no-new
                new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
                    hideElement: containerSelector
                });
            });

        // Toggle new/edit address forms
        document.querySelectorAll('.address-new-toggle').forEach(function (button) {
            button.addEventListener('click', function () {
                var isExpanded =
                    newAddressFormButton.getAttribute('aria-expanded') === 'true';

                newAddressForm.classList.toggle('hide');
                newAddressFormButton.setAttribute('aria-expanded', !isExpanded);
                newAddressFormButton.focus();
            });
        });

        document.querySelectorAll('.address-edit-toggle').forEach(function (button) {
            button.addEventListener('click', function (evt) {
                var formId = evt.target.dataset.formId;
                var editButton = document.getElementById('EditFormButton_' + formId);
                var editAddress = document.getElementById('EditAddress_' + formId);
                var isExpanded = editButton.getAttribute('aria-expanded') === 'true';

                editAddress.classList.toggle('hide');
                editButton.setAttribute('aria-expanded', !isExpanded);
                editButton.focus();
            });
        });

        document.querySelectorAll('.address-delete').forEach(function (button) {
            button.addEventListener('click', function (evt) {
                var target = evt.target.dataset.target;
                var confirmMessage = evt.target.dataset.confirmMessage;

                // eslint-disable-next-line no-alert
                if (
                    confirm(
                        confirmMessage || 'Are you sure you wish to delete this address?'
                    )
                ) {
                    Shopify.postLink(target, {
                        parameters: {_method: 'delete'}
                    });
                }
            });
        });
    }

    /**
     *
     *  Check URL for reset password hash
     *
     */
    function checkUrlHash() {
        var hash = window.location.hash;

        // Allow deep linking to recover password form
        if (hash === '#recover') {
            showRecoverPasswordForm.bind(this)();
        }
    }

    return {
        init: function () {
            initEventListeners();
            checkUrlHash();
            resetPasswordSuccess();
            customerAddressForm();
        }
    };
})();

export default customerTemplates;