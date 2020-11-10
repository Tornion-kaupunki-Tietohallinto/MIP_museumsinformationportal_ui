angular.module('mip.directives').directive('mipKonservointiKasittelyMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Käsittelyn monivalinta
             */
            function link(scope, elem, attrs) {
            	
            	scope.kasittelyt = [];

                ListService.getOptions('ark_kons_kasittely_kaikki').then(function success(options) {

                	scope.kasittelyt = options;

                }, function error(data) {
                    locale.ready('error').then(function() {
                        console.log(data);
                    });
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	lista : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_kasittely_multi.html'
            };
        }
]);