/*
 * Controller for the porrashuoneet list
 */
angular.module('mip.porrashuone').controller(
		'PorrashuoneListController',
		[
				'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'PorrashuoneService', 'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', '$rootScope',
				'MapService', 'CacheFactory', 'EntityBrowserService', 'UserService',
				function($scope, TabService, $location, CONFIG, $filter, NgTableParams, PorrashuoneService, ModalService, AlertService, ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, UserService) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Staircases'));
					});

					/*
                     * Set default layer for map page
                     */
                    MapService.setDefaultLayer("Rakennukset");

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
					 * TABLE FOR LISTING ITEMS
					 */
					$scope.porrashuoneetTable = new NgTableParams({
						page : 1,
						count : 50,
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
							Auth.checkPermissions("rakennusinventointi", "porrashuone").then(function(permissions) {
								if (permissions.katselu) {
									filterParameters = ListService.parseParameters(params);

									 if($scope.promise !== undefined) {
	                                        $scope.cancelRequest();
	                                    }

									 //Save the search parameters to the service.
                                    ListService.savePorrashuoneSearchParameters(filterParameters);


                                    $scope.promise = PorrashuoneService.getPorrashuoneet(filterParameters);
                                    $scope.promise.then(function(data) {

									    if (data.count) {
                                            $scope.searchResults = data.count;
                                        } else {
                                            $scope.searchResults = 0;
                                        }

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
										locale.ready('staircase').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('staircase.No_view_permission'));
										});
									});
								}
							});
						}
					});

					$scope.selectPorrashuone = function(porrashuone) {
						if (!porrashuone) {
						    EntityBrowserService.setQuery('porrashuone', null, filterParameters, 1);
							ModalService.porrashuoneModal(false, null, null);
						} else {

							PorrashuoneService.fetchPorrashuone(porrashuone.properties.id).then(function(porrashuone) {
							    EntityBrowserService.setQuery('porrashuone', porrashuone.properties.id, filterParameters, $scope.porrashuoneetTable.total());
								ModalService.porrashuoneModal(true, porrashuone, null);
							});
						}
					};

					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};

					$scope.$on('Update_data', function(event, data) {
                        if (data.type == 'porrashuone') {
                            $scope.porrashuoneetTable.reload();
                        }
                    });

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
                        if (searchProps['por_jarjestys'] && searchProps['por_jarjestys_suunta']) {
                        	$scope.porrashuoneetTable.sorting(searchProps['por_jarjestys'], searchProps['por_jarjestys_suunta']);
                        }
                        if (searchProps['kuntaId']) {
                            filter['properties']['kuntaId'] = searchProps['kuntaId'];
                        }
                        if (searchProps['kylaId']) {
                            filter['properties']['kylaId'] = searchProps['kylaId'];
                        }

                        if (searchProps['kiinteistoNimi']) {
                            filter['properties']['kiinteisto_nimi'] = searchProps['kiinteistoNimi'];
                        }

                        if (searchProps['osoite']) {
                            filter['properties']['kiinteisto_osoite'] = searchProps['osoite'];
                        }

                        if (searchProps['rakennustyyppi']) {
                            filter['properties']['rakennus_tyyppi'] = searchProps['rakennustyyppi'];
                        }

                        if (searchProps['porrashuoneenTunnus']) {
                            filter['properties']['tunnus'] = searchProps['porrashuoneenTunnus'];
                        }

                        if(searchProps['palstanumero']) {
                            filter['properties']['palstanumero'] = searchProps['palstanumero'];
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

                        angular.extend($scope.porrashuoneetTable.filter(), filter);
                    }
                    $scope.getSearchValues();

                    /*
                     * Clear the save search properties from the service and
                     * reapply the cleared filters.
                     */
                    $scope.clearSearchFilter = function() {
                        ListService.clearProps();
                        $scope.getSearchValues();
                    };

                    /* Rakennustyyppi */
                    $scope.rakennustyyppiOptions = [];
                    $scope.getRakennustyyppiOptions = function() {
                    	ListService.getOptions('rakennustyyppi').then(function success(options) {
                    		$scope.rakennustyyppiOptions = options;
                    	}, function error(data) {
                    		locale.ready('error').then(function() {
                    			AlertService.showError(locale.getString("error.Getting_building_options_failed"), AlertService.message(data));
                    		});
                    	});
                    };
                    $scope.getRakennustyyppiOptions();


                    $scope.porrashuonetyyppiOptions = [];
                    $scope.getPorrashuonetyyppiOptions = function() {
                        ListService.getOptions('porrastyyppi').then(function success(options) {
                            $scope.porrashuonetyyppiOptions = options;
                        }, function error(data) {
                            locale.ready('staircase').then(function() {
                                AlertService.showError(locale.getString("staircase.Getting_staircasetype_options_failed"), AlertService.message(data));
                            });
                        });
                    };
                    $scope.getPorrashuonetyyppiOptions();

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
                     * Refresh the table data
                     */
                    $scope.refreshTable = function() {
                        //Clear the cache
                        CacheFactory.get('porrashuoneCache').removeAll();
                        $scope.porrashuoneetTable.reload();
                    };

                    $scope.currentLocale = locale.getLocale();

                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('porrashuoneet');

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('porrashuoneet', colName, value);
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
