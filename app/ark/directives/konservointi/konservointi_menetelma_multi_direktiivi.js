angular.module('mip.directives').directive('mipKonservointiMenetelmaMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Konservoinnin menetelmien monivalinta 
             */
            function link(scope, elem, attrs) {
            	scope.menetelmat = [];
            	
                ListService.getOptions('ark_kons_menetelma').then(function success(options) {
                    scope.menetelmat = options;
                   
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
                	lista : "=",
                	haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/konservointi/konservointi_menetelma_multi.html'
            };
        }
]);