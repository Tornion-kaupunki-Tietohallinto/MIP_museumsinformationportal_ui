angular.module('mip.directives').directive('mipKohdelajiMulti', [
        'locale', 'ListService', function(locale, ListService) {

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
                    klModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kohdelaji_multi/kohdelaji_multi.html'
            };
        }
]);