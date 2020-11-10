angular.module('mip.directives').directive('mipKarttatyyppi', [
        'locale', 'ListService', 'KarttaService', '$rootScope', function(locale, ListService, KarttaService, $rootScope) {
            /**
             * Karttatyypin valitsin. Jos getNextKarttanumero, päivitetään valinnan jälkeen karttanumero seuraavaan automaattisesti.
             */
            function link(scope, elem, attrs) {
                scope.karttatyypit = [];

                ListService.getOptions('ark_karttatyyppi').then(function success(options) {
                    scope.karttatyypit = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });

                scope.$watch("karttatyyppi", function(oldV, newV, scope) {
                	if(oldV != newV) {
	                	if(scope.getNextKarttanumero === true && scope.karttatyyppi && scope.karttatyyppi.id) {
	                		KarttaService.getNextKarttanumero({'ark_tutkimus_id': scope.tutkimusid, 'karttatyyppi': scope.karttatyyppi.id}).then(function s(data) {
	                			scope.karttaprops.karttanumero = data.properties.karttanumero;
	                			$rootScope.$broadcast('mip-karttatyyppi-karttanumeroChanged', {
	                				'fileId': scope.karttaprops.id
	                			});
	                		}, function e (data) {
	                			// TODO
	                            // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
	                			console.log(data);
	                		});
	                	}
                	}
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    karttatyyppi : '=',
                    required : '=',
                    dis : '=',
                    karttaprops : '=',
                    getNextKarttanumero : '=',
                    tutkimusid: '=',
                	focusInput:'=?'
                },
                transclude: true,
                templateUrl : 'ark/directives/karttatyyppivalitsin/karttatyyppi.html'
            };
        }
]);