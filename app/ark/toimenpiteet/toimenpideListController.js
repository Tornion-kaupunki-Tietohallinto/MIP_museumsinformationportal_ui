/*
 * Konservointitoimenpiteiden listaus controller.
 */
angular.module('mip.toimenpide').controller('ToimenpideListController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'ToimenpideService', 'ModalService',
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService', 'UserService',
		'EntityBrowserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, ToimenpideService, ModalService,
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService, UserService,
				EntityBrowserService) {

			var vm = this;

            /**
             * Setup-metodi
             */
            vm.setUp = function() {

                angular.extend(vm, ListControllerService);

	             // Tabin asetus
	             vm.updateTabs('common.Archeology', 'ark.Operations');

			     vm.getColVisibilities('toimenpide_tab');
            };
            vm.setUp();

            /**
             * ModalHeader kutsuu scopesta closea
             */
            $scope.close = function() {
            	vm.close();
            };

			/*
			 * Toimenpiteet taulu
			 */
            vm.toimenpiteetTable = new NgTableParams({
                page : 1,
                count : 50,
                total : 25,
                filter : {
                	properties : {
                		toimenpiteet: [],
                		menetelmat: [],
                		kayttajat: [],
                		kasittelyt: []
                	}
                }
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {

                    filterParameters = ListService.parseParameters(params);

                    if(vm.toimenpiteetPromise !== undefined) {
                        vm.cancelRequest(vm.toimenpiteetPromise);
                    }
                    // Datepicker:n palauttamasta pitkästä muodosta muotoillaan vain date osa filtteröintiin (esim. 2018-12-24)
                    if(filterParameters.alkaa){
                    	var d = new Date(filterParameters.alkaa);
	                  	var date =  d.getDate();
	                	var month = (d.getMonth() + 1);
	                	var year =  d.getFullYear();
	                	var muotoiltuPvm =  year + "-" + month + "-" + date ;

	                	filterParameters.alkaa = muotoiltuPvm;
                    }


                    // Hakukriteerit talteen
                    //ListService.saveNayteSearchParameters(filterParameters);

                    vm.toimenpiteetPromise = ToimenpideService.haeToimenpiteet(filterParameters);
                    vm.toimenpiteetPromise.then(function(data) {

                        if (data.count) {
                            vm.searchResults = data.count;
                        } else {
                            vm.searchResults = 0;
                        }

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
             * Lisää uusi toimenpide
             */
            vm.lisaaToimenpide = function (){
            	var kayttaja = UserService.getProperties();

            	vm.toimenpide = {
        			'properties' : {
        				'ark_kons_toimenpide_id': null,
        				'ark_kons_menetelma_id': null,
        				'ark_kons_kasittely_id': null,
        				'toimenpide': {},
        				'menetelma': {},
                        'alkaa': new Date(),
                        'tekija': kayttaja.user
        			}
            	};

            	ModalService.toimenpideModal(vm.toimenpide, true);
            };

            /*
             * Monivalinta select vaatii properties luomisen
             */
            vm.alustaTaulukonFilter = function() {
                // Luodaan properties
                var filter = {
                        'properties' : {}
                    };

		        // Lisätään taulukon filttereihin
                angular.extend(vm.toimenpiteetTable.filter(), filter);
            };

            vm.alustaTaulukonFilter();

			/*
			 * Avaa toimenpide katselutilaan
			 */
			vm.avaaToimenpide = function(valittu_toimenpide) {
				ToimenpideService.haeToimenpide(valittu_toimenpide.properties.id).then(function(toimenpide) {

					ModalService.toimenpideModal(toimenpide, false);

				});
			};

			/*
			 * Päivitetään taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {
                if (data.type == 'toimenpide') {
                    vm.toimenpiteetTable.reload();
                }
            });

            /*
             * Käyttäjien haku
             */
            vm.kayttajat = [];
            vm.getUsers = function() {
                UserService.getUsers({
                    'rivit' : 10000,
                    'aktiivinen' : 'true'
                }).then(function success(data) {
                    if(vm.kayttajat){
                    	vm.kayttajat = [{'id': null, 'etunimi': 'Tekijä'}];
                    }

                    // Otetaan vain tarvittavat tiedot niin toimii ui selectissä
                    for (var i = 0; i < data.features.length; i++){
                        var user = data.features[i].properties;
                        vm.kayttajat.push(user);
                    }

                }, function error(data) {
                    locale.ready('error').then(function() {
                        AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                    });
                });
            };

            vm.getUsers();

			vm.curLocale = locale.getLocale();

			 /**
             * Tallennetut hakukriteerit
             */
            vm.getSearchValues = function() {
                var searchProps = ListService.getProps();

                var filter = {
                    'properties' : {}
                };



                angular.extend(vm.toimenpiteetTable.filter(), filter);
            }
            vm.getSearchValues();

            /*
             * Tyhjennä hakukriteerit
             */
            vm.clearSearchFilter = function() {
                ListService.clearProps();
                vm.getSearchValues();

            };

		}
]);
