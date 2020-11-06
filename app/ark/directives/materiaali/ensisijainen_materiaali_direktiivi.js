angular.module('mip.directives').directive('mipEnsisijainenMateriaali', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Ensisijainen materiaali
             */
            function link(scope, elem, attrs) {
            	for(var i = scope.ensisijaisetMateriaalit.length-1; i>=0; i--) {
            		if(scope.ensisijaisetMateriaalit[i].aktiivinen === false) {
            			scope.ensisijaisetMateriaalit.splice(i, 1); // Do not show inactive in the selection list
            		}
            	}

            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	ensisijaisetMateriaalit: '=',
                	ensisijainenMateriaali: '=',
                	focusInput:'='
                },
                transclude: true,
                templateUrl : 'ark/directives/materiaali/ensisijainen_materiaali.html'
            };
        }
]);