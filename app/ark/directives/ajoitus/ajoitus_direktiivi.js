angular.module('mip.directives').directive('mipAjoitus', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen ajoitus ja tarkentimen valitsin.
             */
            function link(scope, elem, attrs) {
                scope.ajoitukset = [];
                scope.ajoitustarkenteet = [];

                ListService.getOptions('ajoitus').then(function success(options) {
                    scope.ajoitukset = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });
                ListService.getOptions('ajoitustarkenne').then(function success(options) {
                    scope.ajoitustarkenteet = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });
                
                scope.addAjoitus = function() {
                    scope.valitutajoitukset.push(
                            {
                                'ajoitus': null,
                                'tarkenne': null
                            }
                    );
                }                
                
                scope.deleteAjoitus = function(index) {
                    scope.valitutajoitukset.splice(index, 1);
                }
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valitutajoitukset : '=',
                    ajoitusrequired : '=',
                    tarkenninrequired : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/ajoitus/ajoitus.html'
            };
        }
]);