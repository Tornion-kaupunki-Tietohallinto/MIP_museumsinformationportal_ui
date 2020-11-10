angular.module('mip.directives').directive('mipKyppiStatusMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kyppi statuksen valitsin. Muinaisjäännösrekisterin muuttuneet tai uudet tiedot.
             */
            function link(scope, elem, attrs) {
                scope.kyppitilat = [
	                		{id : 1, nimi_fi : "Uudet kohteet"},
	                		{id : 2, nimi_fi : "Muokatut kohteet"}
                		];
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    kyppiModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kyppi_status_multi/kyppistatus_multi.html'
            };
        }
]);

