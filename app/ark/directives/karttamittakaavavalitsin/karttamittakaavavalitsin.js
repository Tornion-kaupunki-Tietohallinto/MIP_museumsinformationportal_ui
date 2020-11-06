angular.module('mip.directives').directive('mipKarttamittakaava', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Karttakoon valitsin.
             */
            function link(scope, elem, attrs) {
                scope.karttamittakaavat = [];

                ListService.getOptions('ark_mittakaava').then(function success(options) {
                    scope.karttamittakaavat = options;
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
                    karttamittakaava : '=',
                    required : '=',
                    dis : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/karttamittakaavavalitsin/karttamittakaava.html'
            };
        }
]);