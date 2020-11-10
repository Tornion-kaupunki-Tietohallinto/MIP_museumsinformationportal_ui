angular.module('mip.directives').directive('mipTutkimuslajiMulti', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Tutkimustyyppien monivalinta
             */
            function link(scope, elem, attrs) {
            	
            	scope.tutkimuslajit = [];

                ListService.getOptions('ark_tutkimuslaji').then(function success(options) {

                	scope.tutkimuslajit = options;

                }, function error(data) {
                    locale.ready('error').then(function() {
                        console.log(data);
                    });
                });
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	lista : "="
                },
                transclude: true,
                templateUrl : 'ark/directives/tutkimuslaji/tutkimuslaji_multi.html'
            };
        }
]);