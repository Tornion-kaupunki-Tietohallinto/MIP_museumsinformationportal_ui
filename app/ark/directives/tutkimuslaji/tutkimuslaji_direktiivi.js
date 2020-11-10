angular.module('mip.directives').directive('mipTutkimuslaji', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Tutkimuksen tyyppi eli tutkimuslaji.
             */
            function link(scope, elem, attrs) {
                scope.tutkimuslajit = [];

                ListService.getOptions('ark_tutkimuslaji').then(function success(options) {
                    scope.tutkimuslajit = options;
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
                    laji : '=',
                    lajirequired : '=',
                    vm : '=',
                	focusInput:'='
                },
                transclude: true,
                templateUrl : 'ark/directives/tutkimuslaji/tutkimuslaji.html'
            };
        }
]);