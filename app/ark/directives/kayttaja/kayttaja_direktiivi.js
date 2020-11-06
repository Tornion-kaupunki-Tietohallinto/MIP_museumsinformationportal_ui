angular.module('mip.directives').directive('mipKayttaja', [
        'locale', 'UserService', function(locale, UserService) {
            /**
             * Käyttäjän haku MIP järjestelmästä.
             * Toistaiseksi ARK puolella vain vastuuhenkilön haussa. Nimetty näin, jos tulee tarve hakea käyttäjä muuhun tarpeeseen.
             * Voisi jonkin vivun kautta vain vaihtaa html.
             */
            function link(scope, elem, attrs) {
            	
            	scope.kayttajat = [];
            	
                UserService.getUsers({
                    'rivit' : 10000,
                    'aktiivinen' : 'true'
                }).then(function success(data) {
                    scope.kayttajat = data.features;
                }, function error(data) {
                    locale.ready('error').then(function() {
                        AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                    });
                });

            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	vastuuhenkilo : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kayttaja/vastuuhenkilo.html'
            };
        }
]);