angular.module('mip.directives').directive('mipKohdetyyppitarkenneMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen tyypin ja tarkentimen valitsin.
             */
            function link(scope, elem, attrs) {
                scope.kohdetyyppitarkenteet = [];

                ListService.getOptions('ark_kohdetyyppitarkenne').then(function success(options) {
                    scope.kohdetyyppitarkenteet = options;
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
                    kttModel : '=',
                    tyypit : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kohdetyyppi_multi/kohdetyyppitarkenne_multi.html'
            };
        }
]);