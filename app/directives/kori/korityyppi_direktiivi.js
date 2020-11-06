angular.module('mip.directives').directive('mipKorityyppi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Korityypit 
             */
            function link(scope, elem, attrs) {

            	scope.korityypit = [];
                ListService.getOptions('korityyppi').then(function success(options) {
                	
                	//scope.korityypit = options;
                	
                	// Suodatetaan taulun nimen perusteella. Kaikki ARK puolen taulut alkavat 'ark_'
                	if(scope.mip === 'ARK'){
                    	for(var i = 0; i<options.length; i++) {
                    		var alku = options[i].taulu.substring(0, 4);
                    		if(alku === 'ark_') {
                    			scope.korityypit.push(options[i]);
                    		}
                    	}
                	}else{
                    	for(var i = 0; i<options.length; i++) {
                    		var alku = options[i].taulu.substring(0, 4);
                    		if(alku !== 'ark_') {
                    			scope.korityypit.push(options[i]);
                    		}
                    	}
                	}

                }, function error(data) {
                    locale.ready('error').then(function() {
                        console.log(data);
                    });
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    tyyppi : '=',
                    mip : '='
                },
                transclude: true,
                templateUrl : 'directives/kori/korityyppi.html'
            };
        }
]);