angular.module('mip.directives').directive('mipLoytoTilaMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Löydön tilan monivalinta
             */
            function link(scope, elem, attrs) {
            	scope.loytoTilat = [];
            	
                ListService.getOptions('ark_loyto_tila').then(function success(options) {
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
                	tilat : '=',
                	haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loyto_tila/loyto_tila_multi.html'
            };
        }
]);