angular.module('mip.directives').directive('mipYksikkoTyyppi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Yksikön tyyppi
             */
            function link(scope, elem, attrs) {
                scope.yksikkotyypit = [];

                ListService.getOptions('yksikko_tyyppi').then(function success(options) {
                    scope.yksikkotyypit = options;
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
                    yksikkotyyppi : '=',
                    focusInput:'='
                },
                transclude: true,
                templateUrl : 'ark/directives/yksikko/yksikko_tyyppi.html'
            };
        }
]);