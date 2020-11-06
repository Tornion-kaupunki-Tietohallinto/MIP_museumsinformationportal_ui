angular.module('mip.directives').directive('mipMateriaalikoodiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Materiaalikoodien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.materiaalikoodit = [];
            	
                ListService.getOptions('ark_loyto_materiaalikoodi').then(function success(options) {
                    scope.materiaalikoodit = options;
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
                    mkModel : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/materiaali/materiaalikoodi_multi.html'
            };
        }
]);