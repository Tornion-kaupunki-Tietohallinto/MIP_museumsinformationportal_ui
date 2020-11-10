angular.module('mip.directives').directive('mipKonservointiMateriaaliMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Konservoinnin materiaalien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.materiaalit = [];
            	
                ListService.getOptions('ark_kons_materiaali').then(function success(options) {
                    
                	if(scope.haku){
                    	scope.materiaalit = options;
                    }else{
                        if(options){
                            for(i=0; i < options.length; i++){
                            	if(options[i].aktiivinen){
                            		scope.materiaalit.push(options[i]);
                            	}
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
                	lista : "=",
                	haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_materiaali_multi.html'
            };
        }
]);