angular.module('mip.directives').directive('mipYksikkoTyovaihe', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Yksikön työvaiheen käsittelyt
             */
            function link(scope, elem, attrs) {
                
                // Lisää uusi
                scope.lisaaTyovaihe = function() {

                	if(!scope.tyovaiheet){
                		scope.tyovaiheet = [];
                	}
                	
                    var tyovaihe = {
                    		'paivamaara': null,
                            'kuvaus': null
                         };
                	
                    scope.tyovaiheet.push(tyovaihe);
                }                
                
                scope.poistaTyovaihe= function(index) {
                    scope.tyovaiheet.splice(index, 1);
                }
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	tyovaiheet : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/tyovaihe/tyovaihe.html'
            };
        }
]);