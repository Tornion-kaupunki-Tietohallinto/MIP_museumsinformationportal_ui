angular.module('mip.directives').directive('mipKohdetyyppi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen tyypin ja tarkentimen valitsin.
             */
            function link(scope, elem, attrs) {
                scope.kohdetyypit = [];
                scope.kohdetyyppitarkenteet = [];
                scope.defaultTarkenneLabel = 'Ei määritelty';

                ListService.getOptions('ark_kohdetyyppi').then(function success(options) {
                    scope.kohdetyypit = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });
                ListService.getOptions('ark_kohdetyyppitarkenne').then(function success(options) {
                    scope.kohdetyyppitarkenteet = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });

                scope.getDefaultTarkenneForType = function(tyyppi, indx) {
                	var tyyppiId = tyyppi.id;
                	for(var i = 0; i < scope.kohdetyyppitarkenteet.length; i++) {
                		var tarkenne = scope.kohdetyyppitarkenteet[i];
                		if(tarkenne.ark_kohdetyyppi_id === tyyppiId && tarkenne.nimi_fi === scope.defaultTarkenneLabel) {
                			scope.valituttyypit[indx]['tarkenne'] = tarkenne;
                		}
                	}
                	return null;
                }

                scope.addTyyppi = function() {
                    scope.valituttyypit.push(
                            {
                                'tyyppi': null,
                                'tarkenne': null
                            }
                    );
                }

                scope.deleteTyyppi= function(index) {
                    scope.valituttyypit.splice(index, 1);
                }
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valituttyypit : '=',
                    tyyppirequired : '=',
                    tarkenninrequired : '=',
                    single : '<?'
                },
                transclude: true,
                templateUrl : 'ark/directives/kohdetyyppi/kohdetyyppi.html'
            };
        }
]);