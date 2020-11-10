angular.module('mip.directives').directive('mipMerkintaMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Merkinnät monivalinta 
             */
            function link(scope, elem, attrs) {

                ListService.getOptions('ark_loyto_merkinta').then(function success(options) {
                    scope.merkinnat = options;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        // TODO
                        // AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        console.log(data);
                    });
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    merkinta : '=',
                    haku : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/merkinta/merkinta_multi.html'
            };
        }
]);