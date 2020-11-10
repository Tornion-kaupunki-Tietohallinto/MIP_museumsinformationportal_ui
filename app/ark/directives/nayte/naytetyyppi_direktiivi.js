angular.module('mip.directives').directive('mipNaytetyyppi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Näytetyypit
             */
            function link(scope, elem, attrs) {

            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	naytetyypit: '=',
                	naytetyyppi: '=',
                	vm: '='
                },
                transclude: true,
                templateUrl : 'ark/directives/nayte/naytetyyppi.html'
            };
        }
]);