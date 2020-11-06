angular.module('mip.directives').directive('mipLoytotyyppiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Löytötyyppien monivalinta
             */
            function link(scope, elem, attrs) {
            	scope.loytotyypit = [];
            	
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
                	tyypit : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loytotyyppi/loytotyyppi_multi.html'
            };
        }
]);