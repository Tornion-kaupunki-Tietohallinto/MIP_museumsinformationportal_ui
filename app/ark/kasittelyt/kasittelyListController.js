/*
 * Käsittelyn listaus controller. Käsittelyt välilehti.
 */
angular.module('mip.kasittely').controller('KasittelyListController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'KasittelyService', 'ModalService',
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService', 'KoriService',
		'EntityBrowserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, KasittelyService, ModalService,
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService, KoriService,
				EntityBrowserService) {

			var vm = this;

            /**
             * Setup-metodi
             */
            vm.setUp = function() {

                angular.extend(vm, ListControllerService);

	             // Tabin asetus
	             vm.updateTabs('common.Archeology', 'ark.Treatments');

			     vm.getColVisibilities('kasittely_tab');
            };
            vm.setUp();

            /**
             * ModalHeader kutsuu scopesta closea
             */
            $scope.close = function() {
            	vm.close();
            };

			/*
			 * Konservoinnit taulu
			 */
            vm.kasittelytTable = new NgTableParams({
                page : 1,
                count : 50,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {

                    if(vm.kasittelytPromise !== undefined) {
                        vm.cancelRequest(vm.kasittelytPromise);
                    }

                    filterParameters = ListService.parseParameters(params);

                    // Hakukriteerit talteen
                    ListService.saveKasittelytSearchParameters(filterParameters);

                    vm.kasittelytPromise = KasittelyService.haeKasittelyt(filterParameters);
                    vm.kasittelytPromise.then(function(data) {

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
             * Monivalinta select vaatii properties luomisen
             */
            vm.alustaTaulukonFilter = function() {
                // Luodaan properties
                var filter = {
                        'properties' : {}
                    };

                // Päättyneet
		        filter['properties']['valittu_paattyminen'] = 1;

		        // Lisätään taulukon filttereihin
                angular.extend(vm.kasittelytTable.filter(), filter);
            };

            vm.alustaTaulukonFilter();

            /*
             * Lisää uusi käsittely
             */
            vm.lisaaKasittely = function (){

            	vm.kasittely = {
        			'properties' : {
        				'ark_kasittely_id': null,
                        'alkaa': null,
                        'paattyy': null,
                        'kuvaus': null
        			}
            	};

            	ModalService.kasittelyModal(vm.kasittely, true);
            };

			/*
			 * Avaa käsittely katselutilaan
			 */
			vm.avaaKasittely = function(valittu_kasittely) {

				KasittelyService.haeKasittely(valittu_kasittely.properties.id).then(function(kasittely) {
            		//EntityBrowserService.setQuery('loyto', loyto.properties.id, filterParameters, vm.loydotTable.total());
					ModalService.kasittelyModal(kasittely, false);

				});

			};

			/*
			 * Päivitetään käsittelyjen taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {
                if (data.type == 'kasittely') {
                    vm.kasittelytTable.reload();
                }
            });

            // Päättyneiden haun valintalista
            vm.paattyneet = [
        		{id : 1, nimi_fi : "Avoimet käsittelyt"},
        		{id : 2, nimi_fi : "Päättyneet käsittelyt"},
        		{id : 3, nimi_fi : "Kaikki käsittelyt"}
    		];

			vm.curLocale = locale.getLocale();

			 /**
             * Tallennetut hakukriteerit
             */
            vm.getSearchValues = function() {
                var searchProps = ListService.getProps();

                var filter = {
                    'properties' : {}
                };
                if (searchProps['kas_jarjestys'] && searchProps['kas_jarjestys_suunta']) {
                	vm.kasittelytTable.sorting(searchProps['kas_jarjestys'], searchProps['kas_jarjestys_suunta']);
                }
                if (searchProps['kasittelytunnus']) {
                    filter['properties']['kasittelytunnus'] = searchProps['kasittelytunnus'];
                }
                if (searchProps['valittu_paattyminen']) {
                    filter['properties']['valittu_paattyminen'] = searchProps['valittu_paattyminen'];
                } else {
                	filter['properties']['valittu_paattyminen'] = 1;
                }

                angular.extend(vm.kasittelytTable.filter(), filter);
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
