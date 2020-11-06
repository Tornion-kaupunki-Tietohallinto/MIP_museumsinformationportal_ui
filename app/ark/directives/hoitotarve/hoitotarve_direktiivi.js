angular.module('mip.directives').directive('mipHoitotarve', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen hoitotarpeen valitsin.
             */
            function link(scope, elem, attrs) {
                scope.opts= [];

                ListService.getOptions('hoitotarve').then(function success(options) {
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
                    hoitotarve : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/hoitotarve/hoitotarve.html'
            };
        }
]);