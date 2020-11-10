angular.module('mip.directives').directive('mipKonservointiToimenpide', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Toimenpiteet, vain aktiiviset
             */
            function link(scope, elem, attrs) {
            	scope.toimenpiteet = [];
            	
                ListService.getOptions('ark_kons_toimenpide').then(function success(options) {
                    if(options){
                        for(i=0; i < options.length; i++){
                        	if(options[i].aktiivinen){
                        		scope.toimenpiteet.push(options[i]);
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
                	toimenpide: '=',
                	vm: '='
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_toimenpide.html'
            };
        }
]);