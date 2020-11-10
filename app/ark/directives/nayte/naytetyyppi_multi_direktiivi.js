angular.module('mip.directives').directive('mipNaytetyyppiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Näytetyyppien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.naytetyypit = [];
            	
                ListService.getOptions('ark_naytetyyppi').then(function success(options) {
                    scope.naytetyypit = options;
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
                    tyypit : "="
                },
                transclude: false,
                templateUrl : 'ark/directives/nayte/naytetyyppi_multi.html'
            };
        }
]);