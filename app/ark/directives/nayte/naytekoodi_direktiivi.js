angular.module('mip.directives').directive('mipNaytekoodi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Näytekoodi
             */
            function link(scope, elem, attrs) {

                ListService.getOptions('ark_naytekoodi').then(function success(options) {
                    scope.naytekoodit = options;
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
                    naytekoodi : '=',
                    vm : '=',
                    lomake : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/nayte/naytekoodi.html'
            };
        }
]);