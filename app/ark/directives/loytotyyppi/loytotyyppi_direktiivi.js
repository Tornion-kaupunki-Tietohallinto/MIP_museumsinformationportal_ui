angular.module('mip.directives').directive('mipLoytotyyppi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Löytötyypit. 
             */
            function link(scope, elem, attrs) {

                ListService.getOptions('ark_loyto_tyyppi').then(function success(options) {
                    scope.loytotyypit = options;
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
                    loytotyyppi : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loytotyyppi/loytotyyppi.html'
            };
        }
]);