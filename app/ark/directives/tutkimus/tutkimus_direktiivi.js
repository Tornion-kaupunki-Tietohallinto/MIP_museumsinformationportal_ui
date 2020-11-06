angular.module('mip.directives').directive('mipTutkimus', [
        'locale', 'ListService', 'TutkimusService', function(locale, ListService, TutkimusService) {
            function link(scope, elem, attrs) {
            	scope.tutkimukset = [];

            	scope.tutkimusHaku = function(thaku) {
            		TutkimusService.haeTutkimukset({'nimi': thaku}).then(function(data) {
            			scope.tutkimukset = [];
            			data.features.forEach(function (element) {
            				scope.tutkimukset.push(element.properties);
            			});
                	});
            	}
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    tModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/tutkimus/tutkimus.html'
            };
        }
]);