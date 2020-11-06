angular.module('mip.directives').directive('mipKonservointiMenetelma', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Menetelmat. Haku controllerissa
             */
            function link(scope, elem, attrs) {

            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	menetelma: '=',
                	menetelmat: '=',
                	vm: '='
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_menetelma.html'
            };
        }
]);