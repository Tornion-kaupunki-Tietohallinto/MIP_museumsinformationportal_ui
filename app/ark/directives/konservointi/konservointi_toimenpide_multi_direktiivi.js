angular.module('mip.directives').directive('mipKonservointiToimenpideMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Konservoinnin toimenpiteiden monivalinta 
             */
            function link(scope, elem, attrs, $select) {
            	scope.toimenpiteet = [];
            	
                ListService.getOptions('ark_kons_toimenpide').then(function success(options) {
                    scope.toimenpiteet = options;
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
                templateUrl : 'ark/directives/konservointi/konservointi_toimenpide_multi.html'
            };
        }
]);