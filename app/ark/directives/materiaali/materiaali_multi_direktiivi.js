angular.module('mip.directives').directive('mipMateriaaliMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Muut materiaalit.
             */
            function link(scope, elem, attrs) {
            	scope.materiaalit = [];

                ListService.getOptions('ark_loyto_materiaali').then(function success(options) {
                	if(scope.haku === false || scope.haku === undefined) {
                		for(var i = options.length-1; i>=0; i--) {
                			if(options[i].aktiivinen === false) {
                				options.splice(i, 1); // Do not show inactive in the selection list
                			}
                		}
                	}
                    scope.materiaalit = options;
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
                    muutMateriaalit : '=',
                    haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/materiaali/materiaali_multi.html'
            };
        }
]);