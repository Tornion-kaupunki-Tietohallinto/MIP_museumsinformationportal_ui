angular.module('mip.directives').directive('mipSeulontatapa', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Seulontatapa valintalista
             */
            function link(scope, elem, attrs) {
                scope.seulontatavat = [];

                ListService.getOptions('yksikko_seulontatapa').then(function success(options) {
                    scope.seulontatavat = options;
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
                    seulontatapa : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/seulontatapa/seulontatapa.html'
            };
        }
]);