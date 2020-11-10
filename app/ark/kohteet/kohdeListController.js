/**
 * Kohdelistausnäkymän controller
 */
angular.module('mip.kohde').controller(
        'KohdeListController',
        [
                '$scope', 'TabService', '$location', 'KiinteistoService', '$filter', 'NgTableParams', 'CONFIG', 'KuntaService', 'ModalService', 'AlertService',
                'ListService', 'locale', 'Auth', '$rootScope', 'MapService', 'CacheFactory', 'EntityBrowserService', 'InventointiprojektiService', 'UserService', 'KohdeService',
                'ListControllerService',
                function($scope, TabService, $location, KiinteistoService, $filter, NgTableParams, CONFIG, KuntaService, ModalService, AlertService,
                        ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, InventointiprojektiService, UserService, KohdeService,
                        ListControllerService) {

                    var vm = this;

                    /**
                     * Setup-metodi - ajetaan vain kertaalleen
                     */
                    vm.setUp = function() {

                        angular.extend(vm, ListControllerService);

                        //Asetetaan oikat kondikseen väliaikaisesti kovakoodattuna
                        vm.showCreateNewButton = false;

                        vm.updateTabs('common.Archeology', 'ark.Targets');

                        vm.getColVisibilities('kohde');

                    }
                    locale.ready('common').then(function() {
                        locale.ready('ark').then(function() {
                            vm.setUp();
                        });
                    });

                    /**
                     * Kohteet table
                     */
                    vm.kohteetTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25,
                        // must have the filter and its properties defined, otherwise the directive mip-kohdelaji-multi
                        // cannot bind into it
                        filter : {
                        	properties : {
                        		kohdelajit: [],
                        		kohdetyypit: [],
                        		kohdetyyppitarkenteet: [],
                        		ajoitukset: [],
                        		kuntaId: null,
                        		kylaId: null
                        	}
                        }
                    }, {
                        defaultSort : "asc",
                        getData : function($defer, params) {
                            Auth.checkPermissions("arkeologia", "ark_kohde").then(function(permissions) {
                                if (permissions.luonti) {
                                    vm.showCreateNewButton = true;
                                }
                                if (permissions.katselu) {
                                    filterParameters = ListService.parseParameters(params);

                                    if(vm.kohteetPromise !== undefined) {
                                        vm.cancelRequest(vm.kohteetPromise);
                                    }

                                    //Save the search parameters to the service.
                                    //TODO
                                    //ListService.saveKohdeSearchParameters(filterParameters);

                                    vm.kohteetPromise = KohdeService.getKohteet(filterParameters);
                                    vm.kohteetPromise.then(function(data) {

                                        if (data.count) {
                                            vm.searchResults = data.count;
                                        } else {
                                            vm.searchResults = 0;
                                        }

                                        EntityBrowserService.setQuery('kohde', null, filterParameters);

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
                                } else {
                                    locale.ready('common').then(function() {
                                        locale.ready('estate').then(function() {
                                            AlertService.showError(locale.getString('common.Error'), locale.getString('error.No_view_permission'));
                                        });
                                    });
                                }
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        }
                    });


                    /**
                     * Avataan tai luodaan kohde
                     */
                    vm.selectKohde = function(kohde) {
                        locale.ready('common').then(function() {
                            locale.ready('ark').then(function() {
                                if (!kohde) {
                                    //Provide the type of the entity, id is null, filterparameters can be the current filter and list length is 1
                                    //so no browsing can be done.
                                    EntityBrowserService.setQuery('kohde', null, filterParameters, 1);
                                    ModalService.kohdeModal(null);
                                } else {
                                    KohdeService.fetchKohde(kohde.properties.id).then(function(kohde) {

                                        EntityBrowserService.setQuery('kohde', kohde.properties.id, filterParameters, vm.kohteetTable.total());

                                    	if(kohde.properties.kyppi_status == '1'){
                                    		 AlertService.showInfo(locale.getString('ark.Relic_register_added'));
                                    	}else if(kohde.properties.kyppi_status == '2'){
                                    		 AlertService.showInfo(locale.getString('ark.Relic_register_modified'));
                                    	}
                                    	ModalService.kohdeModal(kohde);
                                    });
                                }
                            });
                        });
                    };

                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'kohde') {
                            vm.kohteetTable.reload();
                        }
                    });

                    vm.saveColVisibility = function(colName, value) {
                    	saveColVisibility('kohde', colName, value);
                    };

                    // Tyhjän kohteen valintalista
                    vm.tyhjaKohdeArvot = [
                		{id : 1, nimi_fi : "Tyhjä kohde: Ei"},
                		{id : 2, nimi_fi : "Tyhjä kohde: Kyllä"},
                		{id : 3, nimi_fi : "Tyhjä kohde: Kaikki"}
            		];

                    // Vaatii tarkastusta valintalista
                    vm.vaatiiTarkastustaArvot = [
                		{id : 1, nimi_fi : "Vaatii tarkastusta: Ei"},
                		{id : 2, nimi_fi : "Vaatii tarkastusta: Kyllä"},
                		{id : 3, nimi_fi : "Vaatii tarkastusta: Kaikki"}
            		];

                    /*
                     * Valintalista oletukset
                     */
                    vm.hakuOletukset = function() {
                        // Luodaan properties
                        var filter = {
                                'properties' : {}
                            };

                        // Oletuksena ei tyhjät kohteet
        		        filter['properties']['tyhja'] = 1;

                        // Oletuksena vaatii tarkastusta = Kaikki
        		        filter['properties']['vaatii_tarkastusta'] = 3;

        		        // Lisätään taulukon filttereihin
                        angular.extend(vm.kohteetTable.filter(), filter);
                    };

                    vm.hakuOletukset();

                    /*
                     * Tyhjennä hakukriteerit
                     */
                    vm._clearSearchFilter = function() {
                        ListService.clearProps();
                        vm._getSearchValues();
                    };

                    /*
                     * FETCH SEARCH PARAMS
                     * Get the search parameters from the service and assign them automatically
                     */

                    vm._getSearchValues = function() {
                        var searchProps = ListService.getProps();
                        var value = "";
                        var filter = {
                            'properties' : {}
                        };
                        //TODO: Haetaan listServiceltä kohteen hakuehdot

                        vm.hakuOletukset();
                    }

}]);