angular.module('mip.directives').directive('mipKunto', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen kunnon valitsin.
             */
            function link(scope, elem, attrs) {
                scope.opts= [];

                ListService.getOptions('ark_kunto').then(function success(options) {
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
                    kunto: '=',
                },
                transclude: true,
                templateUrl : 'ark/directives/kunto/kunto.html'
            };
        }
]);