angular.module('mip.directives').directive('mipNaytekoodiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Näytekoodien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.naytekoodisto = [];
            	
                ListService.getOptions('ark_naytekoodi').then(function success(options) {
                    scope.naytekoodisto = options;
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
                    koodit : "="
                },
                transclude: false,
                templateUrl : 'ark/directives/nayte/naytekoodi_multi.html'
            };
        }
]);