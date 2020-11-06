angular.module('mip.directives').directive('mipSuojelutiedot', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Suojelutietojen valitsin.
             */
            function link(scope, elem, attrs) {
               
                scope.suojeluOptions = [];
               
                scope.getSuojeluOptions = function() {
                    ListService.getOptions('suojelutyypit').then(function success(options) {

                        // lets "flatten" the data for select to work correctly, to create the groups
                        angular.forEach(options, function(grp) {
                            angular.forEach(grp.suojelutyypit, function(st) {
                                st.suojelutyyppi_ryhma_nimi = grp.nimi_fi;
                                scope.suojeluOptions.push(st);
                            })
                        });

                    }, function error(data) {
                        locale.ready('error').then(function() {
                            AlertService.showError(locale.getString("error.Getting_protection_options_failed"), AlertService.message(data));
                        });
                    });
                };

                scope.getSuojeluOptions();
                              
                /*
                 * Add a new suojelutieto
                 */
                scope.addSuojelutieto = function() {
                    var s = {
                        'suojelutyyppi_id' : null,
                        'suojelutyyppi' : {
                            'id' : null,
                            'suojelutyyppi_ryhma_id' : null,
                            'suojelutyyppi' : {
                                'id' : null
                            }
                        }
                    };
                    scope.valitutsuojelutiedot.push(s);
                }

                /*
                 * Remove a suojelutieto
                 */
                scope.deleteSuojelutieto = function(index) {
                    scope.valitutsuojelutiedot.splice(index, 1);
                }
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valitutsuojelutiedot : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/suojelutiedot/suojelutiedot.html'
            };
        }
]);