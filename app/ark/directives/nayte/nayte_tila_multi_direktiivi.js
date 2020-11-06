angular.module('mip.directives').directive('mipNayteTilaMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Näytteen tilojen monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.nayteTilat = [];
            	
                ListService.getOptions('ark_nayte_tila').then(function success(options) {
                    scope.nayteTilat = options;
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
                    tilat : "="
                },
                transclude: false,
                templateUrl : 'ark/directives/nayte/nayte_tila_multi.html'
            };
        }
]);