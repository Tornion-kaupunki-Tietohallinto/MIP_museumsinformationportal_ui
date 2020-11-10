/*
 * Controller for the authentication page
 */
angular.module('mip.login', [
        'mip.auth', 'mip.user'
]);

angular.module('mip.login').controller('AuthController', [
        '$scope', '$location', 'Auth', 'SessionService', 'UserService', '$cookies', 'CONFIG', function($scope, $location, Auth, SessionService, UserService, $cookies, CONFIG) {
          
            /*
             * Language helper for toggling the correct image on the login screen. Does not affect the application / user language.
             */
            var cookie = $cookies.get('COOKIE_LOCALE_LANG');
            $scope.lang = 'fi';
            $scope.version = CONFIG.APP_VERSION;
            
            if(cookie) {
                if (cookie == "\"sv-FI\"") {            
                    $scope.lang = 'se';
                } else if(cookie == "\"en-US\"") {                    
                    $scope.lang = 'en';
                } 
            } 
            
            /*
             * Submit the login data
             */
            $scope.loginSubmit = function() {
                Auth.login($scope.loginData);
            };
            
            /*
             * Submit the logout
             */
            $scope.logout = function() {
                Auth.logout();
            };

            /*
             * Password restoration
             */
            $scope.passwordRestorationSubmit = function() {
                Auth.restorePassword($scope.passwordRestorationData);
            };

            /*
             * Cancel password restoration
             */
            $scope.cancelPasswordRestoration = function() {
                $location.path('/kirjaudu');
            };

            
            /*
             * Redicrect the user if the is already authenticated.
             */
            if (SessionService.isAuthenticated().Auth) {               
                UserService.getUserId().then(function(response) {
                    if (UserService.getProperties().user.id != '') {
                        $location.path(SessionService.getDestination());
                    }
                });
            }

        }
]);