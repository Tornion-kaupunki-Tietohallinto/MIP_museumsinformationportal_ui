angular.module('mip.directives').directive('mipKarttakoko', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Karttakoon valitsin.
             */
            function link(scope, elem, attrs) {
                scope.karttakoot = [];

                ListService.getOptions('ark_karttakoko').then(function success(options) {
                    scope.karttakoot = options;
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
                    karttakoko : '=',
                    required : '=',
                    dis : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/karttakokovalitsin/karttakoko.html'
            };
        }
]);