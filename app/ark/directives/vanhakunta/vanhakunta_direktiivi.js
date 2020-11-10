angular.module('mip.directives').directive('mipVanhakunta', [
        'locale', function(locale) {
            /**
             * Kohteen vanhojen kuntien valitsin.
             */
            function link(scope, elem, attrs) {
                scope.addVK = function() {
                    scope.valitutvanhatkunnat.push(
                            {
                                'kuntanimi': ''
                            }
                    );
                };                
                
                scope.deleteVK= function(index) {
                    scope.valitutvanhatkunnat.splice(index, 1);
                };
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valitutvanhatkunnat: '=',
                },
                transclude: true,
                templateUrl : 'ark/directives/vanhakunta/vanhakunta.html'
            };
        }
]);