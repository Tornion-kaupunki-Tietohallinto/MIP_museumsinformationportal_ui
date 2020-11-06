angular.module('mip.directives').directive('mipTalteenottotapa', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Talteenottotavat 
             */
            function link(scope, elem, attrs) {

                ListService.getOptions('ark_nayte_talteenottotapa').then(function success(options) {
                	
                	scope.talteenottotavat = options;

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
                    talteenottotapa : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/nayte/talteenottotapa.html'
            };
        }
]);