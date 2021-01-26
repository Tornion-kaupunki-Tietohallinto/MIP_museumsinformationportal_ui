/*
 * Controller for users in tutkimus.
 */
angular.module('mip.tutkimus').controller(
        'TutkimusKayttajatController',
        [
                '$scope', 'TutkimusService', 'AlertService', 'locale', 'tutkimus', 'UserService', 'selectedModalNameId',
                'ModalControllerService',
                function($scope, TutkimusService, AlertService, locale, tutkimus, UserService, selectedModalNameId, ModalControllerService) {
                    var vm = this;
                    /**
                     * Controllerin set-up. Suoritetaan ainoastaan kerran.
                     */
                    vm.setUp = function() {

                        angular.extend(vm, ModalControllerService);

                        // Valitun modalin nimi ja järjestysnumero
                        vm.modalNameId = selectedModalNameId;
                        vm.setModalId();

                        // Valittu tutkimus
                        vm.tutkimus = tutkimus;
                        // Lisättävät käyttäjät
                        vm.lisattavatKayttajat = [];
                        // Poistettavat käyttäjät
                        vm.poistettavatKayttajat = [];
                    };
                    vm.setUp();

                    /*
                     * Close
                     */
                    $scope.close = function() {
                        vm.close();
                        $scope.$destroy();
                    };

                    /*
                     * FETCH NEEDED DATA
                     */
                    /*
                     * Users
                     */
                    vm.kayttajat = [];
                    vm.getUsers = function() {
                        UserService.getUsers({
                            'rivit' : 10000000,
                            'aktiivinen' : 'true'
                        }).then(function success(data) {
                            vm.kayttajat = data.features;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                            });
                        });
                    };

                    vm.getUsers();

                    // Lisää käyttäjä lisättävien käyttäjien listaan
                    vm.addUser = function() {
                        var addUser = true;
                        // Jos lisättävää käyttäjää ei olekaan valittuna jostain syystä
                        if (!vm.selectedUser.user) {
                            addUser = false;
                        }
                        // Katsotaan ettei ko. käyttäjä ole jo lisättävissä
                        for (var i = 0; i < vm.lisattavatKayttajat.length; i++) {
                            if (vm.lisattavatKayttajat[i].id === vm.selectedUser.user.properties.id) {
                                addUser = false;
                                break;
                            }
                        }
                        // Katsotaan ettei ko. käyttäjä ole jo tutkimuksen käyttäjissä
                        for (var i = 0; i < vm.tutkimus.properties.tutkimuskayttajat.length; i++) {
                            if (vm.tutkimus.properties.tutkimuskayttajat[i].id === vm.selectedUser.user.properties.id) {
                                addUser = false;
                                break;
                            }
                        }

                        if (addUser) {
                            /* Inventointi tutkimuksella halutaan tallentaa erikseen organisaatio tutkijalle.
                             * Lisätään kenttä formille.
                            */
                            if(vm.tutkimus.properties.tutkimuslaji.id === 5){
                                vm.selectedUser.user['properties']['inv_tutkija_organisaatio'] = '';
                            }

                            vm.lisattavatKayttajat.push(vm.selectedUser.user.properties);
                        }
                    };

                    // Lisää käyttäjä poistettavien listaan
                    vm.removeUser = function(id) {
                        vm.poistettavatKayttajat.push(id);
                    };

                    // Onko tutkimuskäyttäjä poistettavien listalla
                    vm.isPoistettava = function(id) {
                        for (var i = 0; i < vm.poistettavatKayttajat.length; i++) {
                            if (id === vm.poistettavatKayttajat[i]) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // Peruuta tutkimuskäyttäjän lisääminen poistettavien listaan
                    vm.cancelRemove = function(id) {
                        for (var i = 0; i < vm.poistettavatKayttajat.length; i++) {
                            if (id === vm.poistettavatKayttajat[i]) {
                                vm.poistettavatKayttajat.splice(i, 1);
                                break;
                            }
                        }
                    };

                    // Peruuta käyttäjän lisääminen lisättävien käyttäjien listaan
                    vm.cancelAdd = function(id) {
                        for (var i = 0; i < vm.lisattavatKayttajat.length; i++) {
                            if (vm.lisattavatKayttajat[i].id == id) {
                                vm.lisattavatKayttajat.splice(i, 1);
                                break
                            }
                        }
                    };

                    vm.save = function() {
                        // Postataan käyttäjät tutkimus/kaytta
                        var data = {
                            'tutkimusId' : vm.tutkimus.properties.id,
                            'lisattavat' : vm.lisattavatKayttajat,
                            'poistettavat' : vm.poistettavatKayttajat
                        }

                        TutkimusService.muokkaaKayttajia(data).then(function s(data) {
                            vm.close();
                            $scope.$destroy();
                        }, function e(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('common.Save_failed'), AlertService.message(data));
                            });
                        });
                    };
                }
        ]);
