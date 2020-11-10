angular.module('mip.directives').directive('mipKonservointiKasittely', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Käsittely
             */
            function link(scope, elem, attrs) {
            	// Tyhjä valinta
            	scope.kasittelyt = [{'id': null, 'kasittelytunnus': 'Valitse'}];
            	
            	// Palautetaan käsittelyt joilla ei ole päätöspäivää tai se on voimassa
                ListService.getOptions('ark_kons_kasittely').then(function success(options) {

                    if(options){
                        for(i=0; i < options.length; i++){
                        	scope.kasittelyt.push(options[i]);
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
                	kasittely: '='
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_kasittely.html'
            };
        }
]);