angular.module('mip.directives').directive('mipRauhoitusluokka', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen rauhoitusluokan valitsin.
             */
            function link(scope, elem, attrs) {
                scope.rauhoitusluokat = [];

                ListService.getOptions('rauhoitusluokka').then(function success(options) {
                    scope.rauhoitusluokat = options;
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
                    luokka : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/rauhoitusluokka/rauhoitusluokka.html'
            };
        }
]);