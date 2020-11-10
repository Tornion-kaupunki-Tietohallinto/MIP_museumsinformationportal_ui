angular.module('mip.directives').directive('mipKaivaustapa', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kaivaustapa valintalista
             */
            function link(scope, elem, attrs) {
                scope.kaivaustavat = [];

                ListService.getOptions('yksikko_kaivaustapa').then(function success(options) {
                    scope.kaivaustavat = options;
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
                    kaivaustapa : '=',
                    focusInput :'='
                },
                transclude: true,
                templateUrl : 'ark/directives/kaivaustapa/kaivaustapa.html'
            };
        }
]);