angular.module('mip.directives').directive('mipMaalajiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Maalajien monivalinta 
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
                    maalajiModel : "=",
                    paasekoite  : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/maalaji/maalaji_multi.html'
            };
        }
]);