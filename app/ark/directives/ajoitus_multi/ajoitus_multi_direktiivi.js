angular.module('mip.directives').directive('mipAjoitusMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen ajoitus valitsin.
             */
            function link(scope, elem, attrs) {
                scope.ajoitukset = [];

                ListService.getOptions('ajoitus').then(function success(options) {
                    scope.ajoitukset = options;
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
                    ajModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/ajoitus_multi/ajoitus_multi.html'
            };
        }
]);