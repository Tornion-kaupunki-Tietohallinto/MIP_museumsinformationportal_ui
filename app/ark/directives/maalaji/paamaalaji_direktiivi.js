angular.module('mip.directives').directive('mipPaamaalaji', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Päämaalaji
             */
            function link(scope, elem, attrs) {
            	scope.maalajit = [];
                ListService.getOptions('yksikko_maalaji').then(function success(options) {
                    scope.maalajit = options;
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
                    paamaalaji : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/maalaji/paamaalaji.html'
            };
        }
]);