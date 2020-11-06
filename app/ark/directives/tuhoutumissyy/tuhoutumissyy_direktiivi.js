angular.module('mip.directives').directive('mipTuhoutumissyy', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen tuhoutumissyyn valitsin.
             */
            function link(scope, elem, attrs) {
                scope.tuhoutumissyyt = [];

                ListService.getOptions('ark_tuhoutumissyy').then(function success(options) {
                    scope.tuhoutumissyyt = options;
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
                    tuhoutumissyy : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/tuhoutumissyy/tuhoutumissyy.html'
            };
        }
]);