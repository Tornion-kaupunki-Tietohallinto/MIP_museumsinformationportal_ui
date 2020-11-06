angular.module('mip.directives').directive('mipTutkimusalueValitsin', [
        'locale', 'ListService', 'TutkimusalueService', '$filter', function(locale, ListService, TutkimusalueService, $filter) {
            function link(scope, elem, attrs) {
            	scope.tutkimukset = [];

            	scope.alueHaku = function(thaku) {
            		TutkimusalueService.getTutkimusalueet({'ark_tutkimus_id': scope.tutkimus.id, 'tutkimus': thaku}).then(function(data) {
            			scope.alueet = [];
            			data.features.forEach(function (element) {
            				scope.alueet.push(element.properties);
            			});
            			scope.alueet = scope.alueet.reverse();
                	});
            	}
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    tutkimus : '=',
                    yksikko : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/tutkimusaluevalitsin/mipaluevalitsin.html'
            };
        }
]);