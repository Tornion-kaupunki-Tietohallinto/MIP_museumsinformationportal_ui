angular.module('mip.directives').directive('mipRajaustarkkuus', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kohteen rajaustarkkuuden valitsin.
             */
            function link(scope, elem, attrs) {
                scope.opts= [];

                ListService.getOptions('rajaustarkkuus').then(function success(options) {
                    scope.opts = options;
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
                    rajaustarkkuus : '=',
                },
                transclude: true,
                templateUrl : 'ark/directives/rajaustarkkuus/rajaustarkkuus.html'
            };
        }
]);