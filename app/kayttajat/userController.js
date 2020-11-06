/*
 * Controller for the user details.
 */
angular.module('mip.user').controller(
        'UserController',
        [
                '$scope', 
                '$rootScope', 
                '$q', 
                '$http', 
                '$location', 
                'CONFIG', 
                'UserService',
                'ModalService',
                '$routeParams', 
                'mode', 
                'AlertService', 
                'user', 
                'locale', 
                '$window', 
                '$cookies', 
                'selectedModalNameId',
                function($scope, $rootScope, $q, $http, $location, CONFIG, UserService, ModalService, $routeParams, mode, AlertService, user, locale, $window, $cookies, selectedModalNameId) {

                    //Pattern for valid password
                    var pattern = /^(?=.*[a-z])(?=.*[A-ZÅÄÖ])(?=.*\d)[a-zåäöA-ZÅÄÖ!@#%&\d]{6,}$/;
                    
                    /*
                     * Mode selection - currentUserEdit is used when the navbar is clicked, other mode is used when the UserList is clicked and we're editing other user.
                     */
                    if (user) {
                        $scope.user = user;
                    } else {
                        $scope.user = {
                            'aktiivinen' : true,
                            'kieli' : 'fi',
                            'vanhatKarttavarit': false
                        };
                    }
                    
                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                    
                    $scope.activeOptions = [
                            {
                                value : true,
                                label : locale.getString('common.Yes')
                            }, {
                                value : false,
                                label : locale.getString('common.No')
                            }
                    ];

                    $scope.currentUserRole = UserService.getProperties().user.rooli;
                    $scope.currentUserArkRole = UserService.getProperties().user.ark_rooli;

                    $scope.original = angular.copy($scope.user);

                    /*
                     * Show or hide the delete button. Visible if it's not a new user or not myself.
                     */
                    $scope.showDelete = function() {
                        if ($scope.user.id == UserService.getProperties().user.id || !$scope.user.id)
                            return false;
                        else
                            return true;
                    };

                    // SAVE
                    $scope.saveUserSettings = function(modalNameId) {
                        $scope.userToSave = angular.copy($scope.user);
                        // If existing user, the email is sent only if it has been
                        // changed
                        if ($scope.user.id) {
                            if ($scope.user.sahkoposti == $scope.original.sahkoposti) {
                                delete $scope.userToSave.sahkoposti;
                            }
                        }
                        UserService.saveUser($scope.userToSave).then(function(id) {
                           
                            AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('common.User_information_saved', {
                                firstName : $scope.user.etunimi,
                                lastName : $scope.user.sukunimi
                            }));

                            $scope.user.id = id;

                            if ($scope.userToSave.id == UserService.getProperties().user.id) {
                                var lang = "\"fi-FI\"";
                                if ($scope.userToSave.kieli == "se") {
                                    lang = "\"sv-FI\"";
                                } else if ($scope.userToSave.kieli == "en") {
                                    lang = "\"en-US\"";
                                }

                                $cookies.put("COOKIE_LOCALE_LANG", lang);

                                $window.location.reload();
                            }
                            /*
                             * Broadcast the modified data to scopes
                             */
                            delete $scope.user.salasana;
                            delete $scope.user.salasanaUudelleen;
                            $rootScope.$broadcast('Kayttaja_luotu', {
                                'kayttaja' : $scope.user
                            });
                            
                            $scope.close();
                            $scope.$destroy();

                            
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

                    // Close
                    $scope.close = function() {
                        // Asetetaan käyttäjän tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.user.hasOwnProperty(property)) {
                                $scope.user[property] = $scope.original[property];
                            }
                        }
                        // Poistetaan salasana
                        delete $scope.user.salasana;
                        
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        
                        $scope.$destroy();
                    };

                    // DELETE
                    $scope.deleteUser = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete_user'));
                        if (conf) {
                            UserService.deleteUser($scope.user).then(function() {
                                AlertService.showInfo(locale.getString('common.User_deleted'));
                                $scope.close();
                                $scope.$destroy();
                            });
                        }
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=KAYTTAJA&modalId=" + $scope.user.id
                    };
                                        
                    $scope.pswChanged = function() {                       
                        
                        if($scope.user.salasana && $scope.user.salasana.length > 0) {
                            var isValid = pattern.test($scope.user.salasana);                           
                            
                            if(isValid) {
                                $scope.formUserSettings.password.$setValidity('pwvalid', true);                            
                            } else {
                                $scope.formUserSettings.password.$setValidity('pwvalid', false);
                            }                        
                        } else {                            
                            if(user && user.id) {
                                //Allow empty password for existing user -> not changing password
                                $scope.formUserSettings.password.$setValidity('pwvalid', true);
                            }
                            $scope.user.salasanaUudelleen = '';
                        }       
                        $scope.formUserSettings.passwordConfirmation.$setTouched();
                        
                        $scope.psw2Changed();
                    };
                    
                    $scope.psw2Changed = function() {
                        
                        //If the password has been set, require the same passwords
                        if($scope.user.salasana && $scope.user.salasana.length > 0) {                        
                            if($scope.user.salasana == $scope.user.salasanaUudelleen) {                                
                                $scope.formUserSettings.passwordConfirmation.$setValidity('pwmatch', true);
                            } else {
                                $scope.formUserSettings.passwordConfirmation.$setValidity('pwmatch', false);
                            }
                        } else {
                            $scope.user.salasanaUudelleen = '';
                            $scope.formUserSettings.passwordConfirmation.$setValidity('pwmatch', true);
                        }
                                                
                    };                                      
                }
                
        ]);
