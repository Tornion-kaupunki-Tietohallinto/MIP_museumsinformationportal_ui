/*
 * Tutkimukset listaus controller
 */
angular.module('mip.tutkimus').controller('TutkimusListController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'TutkimusService', 'ModalService',
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService', 'EntityBrowserService',
		'UserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, TutkimusService, ModalService,
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService, EntityBrowserService,
				UserService) {

			var vm = this;

            /**
             * Setup-metodi - ajetaan vain kertaalleen
             */
            vm.setUp = function() {

                angular.extend(vm, ListControllerService);

                // Tabien asetus
                vm.updateTabs('common.Archeology', 'common.Researches');

                // Kolumnien näkyvyys
                vm.getColVisibilities('tutkimus');

                //Ei näytetä oletuksena uuden tutkimuksen luontipainiketta.
                //Tämän näkyvyys asetetaan oikeuksien tarkastuksen yhteydessä kun tutkimukset haetaan
                vm.showCreateNewButton = false;

                vm.getShowCreateButtonPermission();

            };
            locale.ready('common').then(function() {
                locale.ready('ark').then(function() {
                    vm.setUp();
                });
            });

            //Näytetäänkö tutkimusten lisäysnappula
            vm.getShowCreateButtonPermission = function() {
                Auth.checkPermissions("arkeologia", "ark_tutkimus").then(function(permissions) {
                    if (permissions.luonti) {
                        vm.showCreateNewButton = true;
                    }
                });
            };

			/*
			 * Tutkimukset taulu
			 */
            vm.tutkimuksetTable = new NgTableParams({
                page : 1,
                count : 50,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                    //Tutkimusten oikeustarkastelua ei tehdä tässä
                    //vaan palautettavista tutkimuksista on automaattisesti karsittu pois
                    //ne joihin käyttäjällä ei ole oikeutta
                    filterParameters = ListService.parseParameters(params);

                    if(vm.tutkimuksetPromise !== undefined) {
                        vm.cancelRequest(vm.tutkimuksetPromise);
                    }

                    // Hakukriteerit talteen
                    ListService.saveTutkimuksetSearchParameters(filterParameters);

                    vm.tutkimuksetPromise = TutkimusService.haeTutkimukset(filterParameters);
                    vm.tutkimuksetPromise.then(function(data) {

                        if (data.count) {
                            vm.searchResults = data.count;
                        } else {
                            vm.searchResults = 0;
                        }
                        EntityBrowserService.setQuery('tutkimus', null, filterParameters);

                        // no sorting, it is done in backend
                        params.total(data.total_count);
                        $defer.resolve(data.features);

                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        orderedData = [];
                        $defer.resolve(orderedData);
                    });
                }
            });

			/*
			 * Tutkimuksen luominen tai avaaminen
			 */
			vm.selectTutkimus = function(tutkimus) {
				if(!tutkimus) {
					EntityBrowserService.setQuery('tutkimus', null, filterParameters, 1);
					ModalService.tutkimusModal(false, null, null);
				} else {
					TutkimusService.haeTutkimus(tutkimus.properties.id).then(function(tutkimus) {
						EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, filterParameters, vm.tutkimuksetTable.total());
						ModalService.tutkimusModal(true, tutkimus, null);
					});
				}
			};

            /*
             * Taulukon filtterit ja oletukset
             */
            vm.alustaTaulukonFilter = function() {
                // Luodaan properties
                var filter = {
                        'properties' : {}
                    };

                filter['properties']['tutkimuslajit'] = [];

                // Kaikki tilat
		        filter['properties']['tutkimus_valmis'] = 3;

                // Kaikki julkisuudet
		        filter['properties']['tutkimus_julkinen'] = 3;

		        // Lisätään taulukon filttereihin
                angular.extend(vm.tutkimuksetTable.filter(), filter);
            };

            vm.alustaTaulukonFilter();

            // Valintalista
            vm.tutkimustilat = [
        		{id : 1, nimi_fi : "Tutkimuksen tila: Valmis"},
        		{id : 2, nimi_fi : "Tutkimuksen tila: Kesken"},
        		{id : 3, nimi_fi : "Tutkimuksen tila: Kaikki"}
    		];

            // Valintalista
            vm.julkisuudet = [
        		{id : 1, nimi_fi : "Tutkimus julkinen: Kyllä"},
        		{id : 2, nimi_fi : "Tutkimus julkinen: Ei"},
        		{id : 3, nimi_fi : "Tutkimus julkinen: Kaikki"}
    		];

			/*
			 * Päivitetään taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {
                if (data.type == 'tutkimus') {
                    vm.tutkimuksetTable.reload();
                }
            });

            // Käyttäjien valintalista
            vm.kayttajat = [];
            // Organisaatioiden valintalista
            vm.organisaatiot = [];
            vm.getUsers = function() {
                UserService.getUsers({
                    'rivit' : 10000,
                    'aktiivinen' : 'true'
                }).then(function success(data) {
                    vm.kayttajat = data.features;

                    for (var i = 0; i < vm.kayttajat.length; i++) {
						var org = vm.kayttajat[i].properties.organisaatio;
						if(org != null && org != ''){
							if(vm.organisaatiot.indexOf(org) === -1){
								vm.organisaatiot.push(org);
							}
						}
					}

                }, function error(data) {
                    locale.ready('error').then(function() {
                        AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                    });
                });
            };

            vm.getUsers();

			 /**
             * Tallennetut hakukriteerit
             */
            vm._getSearchValues = function() {
                var searchProps = ListService.getProps();

                var filter = {
                    'properties' : {}
                };
                if (searchProps['tut_jarjestys'] && searchProps['tut_jarjestys_suunta']) {
                	vm.kasittelytTable.sorting(searchProps['tut_jarjestys'], searchProps['tut_jarjestys_suunta']);
                }
                if (searchProps['tutkimuslajit']) {
                    filter['properties']['tutkimuslajit'] = searchProps['tutkimuslajit'];
                }
                if (searchProps['tut_nimi']) {
                    filter['properties']['tutkimuksen_nimi'] = searchProps['tut_nimi'];
                }
                if (searchProps['tutkimusLyhenne']) {
                    filter['properties']['tutkimusLyhenne'] = searchProps['tutkimusLyhenne'];
                }
                if (searchProps['loyto_paanumero']) {
                    filter['properties']['loyto_paanumero'] = searchProps['loyto_paanumero'];
                }
                if (searchProps['tutkimus_valmis']) {
                    filter['properties']['tutkimus_valmis'] = searchProps['tutkimus_valmis'];
                } else {
                	filter['properties']['tutkimus_valmis'] = 3;
                }
                if (searchProps['tutkimus_julkinen']) {
                    filter['properties']['tutkimus_julkinen'] = searchProps['tutkimus_julkinen'];
                } else {
                	filter['properties']['tutkimus_julkinen'] = 3;
                }
                if (searchProps['kenttatyo_alkuvuosi']) {
                    filter['properties']['kenttatyo_alkuvuosi'] = searchProps['kenttatyo_alkuvuosi'];
                }
                if (searchProps['kenttatyo_paatosvuosi']) {
                    filter['properties']['kenttatyo_paatosvuosi'] = searchProps['kenttatyo_paatosvuosi'];
                }
                if (searchProps['kenttatyojohtaja']) {
                    filter['properties']['kenttatyojohtaja'] = searchProps['kenttatyojohtaja'];
                }
                if (searchProps['kl_koodi']) {
                    filter['properties']['kl_koodi'] = searchProps['kl_koodi'];
                }
                if (searchProps['tutkija']) {
                    filter['properties']['tutkija'] = searchProps['tutkija'];
                }
                if (searchProps['organisaatio']) {
                    filter['properties']['organisaatio'] = searchProps['organisaatio'];
                }
                if (searchProps['nayte_paanumero']) {
                    filter['properties']['nayte_paanumero'] = searchProps['nayte_paanumero'];
                }

                angular.extend(vm.tutkimuksetTable.filter(), filter);
            }
            vm._getSearchValues();

            /*
             * Tyhjennä hakukriteerit
             */
            vm._clearSearchFilter = function() {
                ListService.clearProps();
                vm._getSearchValues();

            };

            /**
             * Taulukon kolumnien tekstien haku
             */
            vm.getColumnName = function(column, lang_file) {
                var str;

                if (lang_file) {
                    str = lang_file + '.' + column;
                } else {
                    str = 'common.' + column;
                }

                return locale.getString(str);
            }

			vm.curLocale = locale.getLocale();

		}
]);
