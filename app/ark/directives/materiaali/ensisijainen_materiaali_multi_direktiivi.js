angular.module('mip.directives').directive('mipEnsisijainenMateriaaliMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Ensisijaisten materiaalien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.ensisijaiset_materiaalit = [];
            	
                ListService.getOptions('ark_loyto_materiaali').then(function success(options) {
                    scope.ensisijaiset_materiaalit = options;
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
                    ensisijaiset : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/materiaali/ensisijainen_materiaali_multi.html'
            };
        }
]);