angular.module('mip.directives').directive('mipKohdelaji', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen lajin valitsin.
             */
            function link(scope, elem, attrs) {
                scope.kohdelajit = [];

                ListService.getOptions('ark_kohdelaji').then(function success(options) {
                    scope.kohdelajit = options;
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
                    laji : '=',
                    lajirequired : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kohdelaji/kohdelaji.html'
            };
        }
]);