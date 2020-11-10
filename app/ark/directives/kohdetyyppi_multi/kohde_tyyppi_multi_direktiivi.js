angular.module('mip.directives').directive('mipKohdetyyppiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen tyypin ja tarkentimen valitsin.
             */
            function link(scope, elem, attrs) {
                scope.kohdetyypit = [];

                ListService.getOptions('ark_kohdetyyppi').then(function success(options) {
                    scope.kohdetyypit = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    ktModel : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/kohdetyyppi_multi/kohdetyyppi_multi.html'
            };
        }
]);