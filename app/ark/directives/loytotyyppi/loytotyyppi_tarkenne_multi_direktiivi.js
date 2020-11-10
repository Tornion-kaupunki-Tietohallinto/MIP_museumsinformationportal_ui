angular.module('mip.directives').directive('mipLoytotyyppiTarkenneMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Löytötyyppien tarkenteet 
             */
            function link(scope, elem, attrs) {
            	scope.tarkenteet = [];
            	
                ListService.getOptions('ark_loyto_tyyppi_tarkenne').then(function success(options) {
                    scope.tarkenteet = options;
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
                	loytotyyppi : '=',
                	haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loytotyyppi/loytotyyppi_tarkenne_multi.html'
            };
        }
]);