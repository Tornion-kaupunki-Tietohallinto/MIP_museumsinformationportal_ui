/*
 * Controller for listing the arvoalueet
 */
angular.module('mip.arvoalue').controller(
		'ArvoalueListController',
		[
				'$scope', 'TabService', '$filter', 'NgTableParams', 'CONFIG', 'ModalService', 'AlertService',
				'ArvoalueService', '$location', 'ListService', 'locale', 'Auth', '$rootScope',
				'MapService', 'CacheFactory', 'EntityBrowserService', '$q', 'KuntaService', 'KylaService', 'InventointiprojektiService', 'UserService', 'KoriService',
				function($scope, TabService, $filter, NgTableParams, CONFIG, ModalService, AlertService,
				        ArvoalueService, $location, ListService, locale, Auth, $rootScope,
				        MapService, CacheFactory, EntityBrowserService, $q, KuntaService, KylaService, InventointiprojektiService, UserService, KoriService) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Valueareas'));
					});

					/*
					 * Set default layer for map page
					 */
					MapService.setDefaultLayer("Arvoalueet");
				    /*
                     * Data for showing the amounts on the screen
                     */
                    $scope.searchResults = 0;

                    /*
                     * Cancel the request. Triggered automatically when the search params are modified.
                     */
                    $scope.cancelRequest = function() {
                        $scope.promise.cancel()
                    };

					/*
					 * TABLE FOR LISTING ALUEET
					 */
					$scope.arvoalueetTable = new NgTableParams({
						page : 1,
						count : 25,
						total : 25,
                        filter : {
                        	properties : {
                        		kuntaId: null,
                        		kylaId : null
                        	}
                        }
					}, {
						defaultSort : "asc",
						getData : function($defer, params) {
							Auth.checkPermissions("rakennusinventointi", "arvoalue").then(function(permissions) {
								if (permissions.katselu) {
									filterParameters = ListService.parseParameters(params);

									if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }

									 //Save the search parameters to the service.
                                    ListService.saveArvoalueSearchParameters(filterParameters);

                                    $scope.promise = ArvoalueService.getArvoalueet(filterParameters);
                                    $scope.promise.then(function(data) {

									    if (data.count) {
                                            $scope.searchResults = data.count;
                                        } else {
                                            $scope.searchResults = 0;
                                        }

                                        // id:t kerätään mahdollista koriin lisäämistä varten
                                        $scope.koriIdLista = [];
                                        $scope.koriIdLista = data.idlist;

										params.total(data.total_count);
										$defer.resolve(data.features);
									}, function(data) {
										locale.ready('common').then(function() {
											AlertService.showWarning(locale.getString('common.Error'),AlertService.message(data));
										});
										orderedData = [];
										$defer.resolve(orderedData);
									});
								} else {
									locale.ready('common').then(function() {
										locale.ready('valuearea').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('valuearea.No_view_permission'));
										});
									});
								}
							});

						}
					});

					/*
					 * Select a arvoalue for editing.
					 */
					$scope.selectArvoalue = function(arvoalue) {
						if (!arvoalue) {
                            EntityBrowserService.setQuery('arvoalue', null, filterParameters, 1);
							ModalService.arvoalueModal(false, null);
						} else {
							ArvoalueService.fetchArvoalue(arvoalue.properties.id).then(function(arvoalue) {
                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, filterParameters, $scope.arvoalueetTable.total());
								ModalService.arvoalueModal(true, arvoalue);
							});
						}
					};

					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};

					$scope.$on('Update_data', function(event, data) {
		                if (data.type == 'arvoalue') {
		                    $scope.arvoalueetTable.reload();
		                }
		            });

					/*
                     * Inventory projects
                     */
                    // Holders for the search items.
                    // ui-select requires them to be introduced, otherwise the control won't work.
                    $scope.inventointiprojektit = [];
                    $scope.getInventointiprojektit = function(search) {
                        var searchObj = {'rivit': 25, 'jarjestys': 'nimi', 'tekninen_projekti': 'false'};
                        if(search) {
                            searchObj['nimi'] = search
                        }
                        var ipPromise = InventointiprojektiService.getInventointiprojektit(searchObj);
                        ipPromise.then(function success(results) {
                            $scope.inventointiprojektit.length = 0;

                            /*
                             * Stripataan propertyt pois - ui-select ei meinaa toimia niiden kanssa.
                             */
                            for(var i = 0; i<results.features.length; i++) {
                                $scope.inventointiprojektit.push(results.features[i].properties);
                            }
                        });
                    };
                    $scope.getInventointiprojektit();

                    $scope.inventoijat = [];
                    $scope.getInventoijat = function(search) {
                        $scope.inventoijat.length = 0;
                        if ($scope.arvoalueetTable.filter() && $scope.arvoalueetTable.filter().properties && $scope.arvoalueetTable.filter().properties.inventointiprojektiId) {
                            var inventoijaPromise = InventointiprojektiService.getInventoijatOfInventointiprojekti($scope.arvoalueetTable.filter().properties.inventointiprojektiId);
                            inventoijaPromise.then(function success(data) {
                                if(data.features) {
                                    for(var i = 0; i<data.features.length; i++) {
                                        $scope.inventoijat.push(data.features[i].properties);
                                    }

                                    for (var i = 0; i < $scope.inventoijat.length; i++) {
                                        $scope.inventoijat[i].tyyppi = locale.getString('common.Inventors');
                                    }

                                    var muutInventoijatPromise = InventointiprojektiService.getMuutInventoijatOfInventointiprojekti($scope.arvoalueetTable.filter().properties.inventointiprojektiId);
                                    muutInventoijatPromise.then(function success(data) {
                                        for (var i = 0; i < data.features.length; i++) {
                                            data.features[i].properties.tyyppi = locale.getString('common.OtherInventors');
                                            $scope.inventoijat.push(data.features[i].properties);
                                        }

                                        //Filter the list using the search term. We match against etunimi or sukunimi.
                                        $scope.inventoijat = ($filter('filter')($scope.inventoijat, {'etunimi': search}) || $filter('filter')($scope.inventoijat, {'sukunimi': search}));
                                    });
                                }
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        } else {

                            var s = {
                                'rivit' : 20,
                                'jarjestys' : 'sukunimi',
                                'inventoijat' : true
                            };
                            if (search) {
                                s['nimi'] = search;
                            }

                            UserService.getUsers(s).then(function success(users) {
                                for(var i = 0; i<users.features.length; i++) {
                                    $scope.inventoijat.push(users.features[i].properties);
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_inventor_list_failed"), AlertService.message(data));
                                })
                            });
                        }
                    };
                    $scope.getInventoijat();

                    /**
                     * Avaa korin hakutulosten lisäämisen ikkunaan. Välitetään lista haetuista id:stä
                     */
                    $scope.lisaaKoriin = function(){
                    	// Haetaan arvoalueiden korityyppi
                    	$scope.koriPromise = KoriService.haeKorityyppi('arvoalue');
        				$scope.koriPromise.then(function (korityyppi){
        					if(korityyppi){
        						ModalService.lisaaKoriModal($scope.koriIdLista, korityyppi, 'RAK');
        					}
        				}, function(data) {
                            locale.ready('common').then(function() {
                                AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

					/*
                     * FETCH SEARCH PARAMS
                     * Get the search parameters from the service and assign them automatically
                     */
                    $scope.getSearchValues = function() {
                        var searchProps = ListService.getProps();
                        var value = "";
                        var filter = {
                            'properties' : {}
                        };
                        if (searchProps['arv_jarjestys'] && searchProps['arv_jarjestys_suunta']) {
                        	$scope.arvoalueetTable.sorting(searchProps['arv_jarjestys'], searchProps['arv_jarjestys_suunta']);
                        }
                        if (searchProps['kuntaId']) {
                            filter['properties']['kuntaId'] = searchProps['kuntaId'];
                        }
                        if (searchProps['kylaId']) {
                            filter['properties']['kylaId'] = searchProps['kylaId'];
                        }

                        if (searchProps['alueNimi']) {
                            filter['properties']['alue_nimi'] = searchProps['alueNimi'];
                        }
                        if (searchProps['arvoalueNimi']) {
                            filter['properties']['nimi'] = searchProps['arvoalueNimi'];
                        }

                        if (searchProps['aluetyyppi']) {
                            filter['properties']['aluetyyppi'] = searchProps['aluetyyppi'];
                        }

                        if (searchProps['arvotus']) {
                            filter['properties']['arvotus'] = searchProps['arvotus'];
                        }

                        if(searchProps['paikkakunta']) {
                            filter['properties']['paikkakunta'] = searchProps['paikkakunta'];
                        }

                        if(searchProps['polygonrajaus']) {
                            filter['properties']['polygonrajaus'] = searchProps['polygonrajaus'];
                        }
                        if(searchProps['aluerajaus']) {
                            filter['properties']['aluerajaus'] = searchProps['aluerajaus'];
                        }
                        if(searchProps['inventointiprojektiId']) {
                            filter['properties']['inventointiprojektiId'] = searchProps['inventointiprojektiId'];

                            InventointiprojektiService.getInventointiprojektit({
                                'rivit' : 10,
                                'jarjestys' : 'nimi',
                                'inventointiprojektiId' : ListService.getProp('inventointiprojektiId')
                            }).then(function success(results) {
                                $scope.inventointiprojektit.length = 0;
                                $scope.inventointiprojektit.push(results.features[0].properties);

                                if ($scope.inventointiprojektit.length == 1 && searchProps['inventoija'].length == 0) {
                                    $scope.getInventoijat();
                                }
                            });
                        }
                        if(searchProps['inventoija']) {
                            filter['properties']['inventoija'] = searchProps['inventoija'];
                            UserService.getUsers({'rivit': 10, 'jarjestys': 'sukunimi', 'id': ListService.getProp('inventoija')}).then(function success(result) {
                                $scope.inventoijat.length = 0;
                                $scope.inventoijat.push(result.features[0].properties);
                            });
                        }

                        if (searchProps['luoja']) {
                            filter['properties']['luoja'] = searchProps['luoja'];
                            UserService.getUsers({
                                'rivit' : 10,
                                'jarjestys' : 'sukunimi',
                                'id' : ListService.getProp('luoja')
                            }).then(function success(result) {
                                $scope.kayttajat.length = 0;
                                $scope.kayttajat.push(result.features[0].properties);
                            });
                        }

                        angular.extend($scope.arvoalueetTable.filter(), filter);
                    }
                    $scope.getSearchValues();

                    /*
                     * Aluetyyppi
                     */
                    $scope.aluetyyppiOptions = [];
                    $scope.getAluetyyppiOptions = function() {
                            ListService.getOptions('aluetyyppi').then(function success(options) {
                                $scope.aluetyyppiOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_areatypes_options_failed"), AlertService.message(data));
                                });
                            });
                    };
                    $scope.getAluetyyppiOptions();

                    /*
                     * Arvotus
                     */
                    $scope.arvotusOptions = [];
                    $scope.getArvotusOptions = function() {
                    	ListService.getOptions('arvotus').then(function success(options) {
                    		$scope.arvotusOptions = options;
                        }, function error(data) {
                        	locale.ready('error').then(function() {
                        	AlertService.showError(locale.getString("error.Getting_valuation_options_failed"), AlertService.message(data));
                            });
                        });
                    };
                    $scope.getArvotusOptions();

                    /*
                     * Helper function - The original selection list items are filtered so that the already selected items are not present This method puts the items back to the list if/when they are removed.
                     */
                    $scope.addItemBackToList = function(item, model) {
                        for (var i = 0; i < model.length; i++) {
                            if (model[i].id == item.id) {
                                return;
                            }
                        }
                        model.push(item);
                    };

                    /*
                     * Clear the save search properties from the service and
                     * reapply the cleared filters.
                     */
                    $scope.clearSearchFilter = function() {
                        ListService.clearProps();
                        $scope.getSearchValues();
                    };

                    /*
                     * Refresh the table data
                     */
                    $scope.refreshTable = function() {
                        //Clear the cache entries
                        CacheFactory.get('arvoalueCache').removeAll();
                        $scope.arvoalueetTable.reload();
                    };

                    $scope.removeAluerajaus = function() {
                        ListService.setProp('polygonrajaus', '');
                        ListService.setProp('aluerajaus', '');
                        $scope.getSearchValues();
                    };

                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('arvoalueet');

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('arvoalueet', colName, value);
                    };
                    /*
                     * END Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */

                    $scope.kayttajat = [];
                    $scope.getKayttajat = function(search) {
                        $scope.kayttajat.length = 0;
                        var s = {
                            'rivit' : 20,
                            'jarjestys' : 'sukunimi',
                        };
                        if (search) {
                            s['nimi'] = search;
                        }

                        UserService.getUsers(s).then(function success(users) {
                            for (var i = 0; i < users.features.length; i++) {
                                $scope.kayttajat.push(users.features[i].properties);
                            }
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                            })
                        });
                    };
                    $scope.getKayttajat();


}]);