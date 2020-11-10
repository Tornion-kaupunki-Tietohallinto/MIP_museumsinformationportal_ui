angular.module('mip.directives').directive('mipMateriaalikoodi', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Materiaalikoodi. Materiaalien ylätaso esim. ME = metalli
             */
            function link(scope, elem, attrs) {
                if (attrs.cols === undefined){
                    scope.cols = 'wide';
                } else {
                    scope.cols = 'narrow';
                }

                ListService.getOptions('ark_loyto_materiaalikoodi').then(function success(options) {
                    scope.materiaalikoodit = options;
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
                    materiaalikoodi : '=',
                    vm : '=',
                    focusInput : '=',
                    cols : '=?'
                },
                transclude: true,
                templateUrl : 'ark/directives/materiaali/materiaalikoodi.html'
            };
        }
]);