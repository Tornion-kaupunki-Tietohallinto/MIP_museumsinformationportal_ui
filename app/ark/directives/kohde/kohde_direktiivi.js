angular.module('mip.directives').directive('mipKohde', [
        'locale', 'ListService', 'KohdeService', function(locale, ListService, KohdeService) {
            function link(scope, elem, attrs) {
            	scope.kohteet = [];

            	scope.kohdeHaku = function(khaku) {
            		KohdeService.getKohteet({'nimi': khaku}).then(function(data) {
            			scope.kohteet = [];
            			data.features.forEach(function (element) {
            				scope.kohteet.push(element.properties);
            			});
                	});
            	}
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    kModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kohde/kohde.html'
            };
        }
]);