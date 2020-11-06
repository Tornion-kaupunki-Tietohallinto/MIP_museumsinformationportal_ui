angular.module('mip.directives').directive('mipAlkuperaisyys', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen alkuperäisyyden valitsin.
             */
            function link(scope, elem, attrs) {
                scope.opts= [];

                ListService.getOptions('alkuperaisyys').then(function success(options) {
                    scope.opts = options;
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
                    alkuperaisyys : '=',
                },
                transclude: true,
                templateUrl : 'ark/directives/alkuperaisyys/alkuperaisyys.html'
            };
        }
]);