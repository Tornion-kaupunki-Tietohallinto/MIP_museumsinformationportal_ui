angular.module('mip.directives').directive('mipMaastomerkinta', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen maastomerkinnan valitsin.
             */
            function link(scope, elem, attrs) {
                scope.opts= [];

                ListService.getOptions('maastomerkinta').then(function success(options) {
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
                    maastomerkinta : '=',
                },
                transclude: true,
                templateUrl : 'ark/directives/maastomerkinta/maastomerkinta.html'
            };
        }
]);