angular.module('mip.directives').directive('mipLoytoTila', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Löydön tilat
             */
            function link(scope, elem, attrs) {

                ListService.getOptions('ark_loyto_tila').then(function success(options) {
                	//Analysoitavana (id:3) on rikki, koska vastaavaa tapahtumaa ei ole ->
                	//filtteröidään pois listalta
                	for(var i = 0; i<options.length; i++) {
                		if(options[i].id == 3) {
                			options.splice(i,1);
                			break;
                		}
                	}
                	scope.loytoTilat = options;

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
                    tila : '=',
                	vm : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loyto_tila/loyto_tila.html'
            };
        }
]);