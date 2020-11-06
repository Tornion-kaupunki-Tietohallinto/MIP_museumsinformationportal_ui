/*
 * Controller for the inventointiprojektit list
 */
angular.module('mip.inventointiprojekti').controller(
		'InventointiprojektiListController',
		[
				'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'InventointiprojektiService', 'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', '$rootScope',
				'MapService', 'CacheFactory', 'EntityBrowserService', 'UserService',
				function($scope, TabService, $location, CONFIG, $filter, NgTableParams, InventointiprojektiService, ModalService, AlertService, ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, UserService) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Inventory_projects'));
					});

					/*
					 * Set default layer for map page
					 */
					MapService.setDefaultLayer("Kiinteistot");

					// will be set to true later if appropriate
					$scope.showCreateNewButton = false;

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
					 * TABLE FOR LISTING PROJECTS
					 */
                    var filterParameters = null;
					$scope.inventointiprojektitTable = new NgTableParams({
						page : 1,
						count : 50,
						total : 25
					}, {
						defaultSort : "asc",
						getData : function($defer, params) {
							Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
								if (permissions.luonti) {
									$scope.showCreateNewButton = true;
								}

								if (permissions.katselu) {
									filterParameters = ListService.parseParameters(params);

									if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }
									
									//Save the search parameters to the service.
                                    ListService.saveInventointiprojektiSearchParameters(filterParameters);
                                  
                                    $scope.promise = InventointiprojektiService.getInventointiprojektit(filterParameters);
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
										locale.ready('inventoryproject').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('inventoryproject.No_view_permission'));
										});
									});
								}
							});
						}
					});
					/*
					 * Open selected inventointiprojekti or create a new one
					 */
					$scope.selectInventointiprojekti = function(inventointiprojekti) {
						if (!inventointiprojekti) {
						    EntityBrowserService.setQuery('inventointiprojekti', null, filterParameters, 1);
	                        ModalService.inventointiprojektiModal(false, null);
						} else {
							InventointiprojektiService.fetchInventointiprojekti(inventointiprojekti.properties.id).then(function(inventointiprojekti) {
							    EntityBrowserService.setQuery('inventointiprojekti', inventointiprojekti.properties.id, filterParameters, $scope.inventointiprojektitTable.total());
                                ModalService.inventointiprojektiModal(true, inventointiprojekti);
							});
						}
					}

					/*
					 * Localize table names
					 */
					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};
					
					$scope.$on('Update_data', function(event, data) {                        
		                if (data.type == 'inventointiprojekti') {
		                    $scope.inventointiprojektitTable.reload();                    
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
                        if (searchProps['inv_jarjestys'] && searchProps['inv_jarjestys_suunta']) {
                        	$scope.inventointiprojektitTable.sorting(searchProps['inv_jarjestys'], searchProps['inv_jarjestys_suunta']);
                        }                        
                        if (searchProps['inventointiprojektiNimi']) {
                            filter['properties']['nimi'] = searchProps['inventointiprojektiNimi'];
                        }
                        if (searchProps['inventointiaika_aloitus']) {
                            filter['properties']['inventointiaika_aloitus'] = searchProps['inventointiaika_aloitus'];
                        }
                        if (searchProps['inventointiaika_lopetus']) {
                            filter['properties']['inventointiaika_lopetus'] = searchProps['inventointiaika_lopetus'];
                        }
                        if (searchProps['toimeksiantaja']) {
                            filter['properties']['toimeksiantaja'] = searchProps['toimeksiantaja'];
                        }
                        if (searchProps['inventointiprojektityyppi']) {
                            filter['properties']['inventointiprojektityyppi'] = searchProps['inventointiprojektityyppi'];
                        }
                        if (searchProps['inventointiprojektilaji']) {
                            filter['properties']['inventointiprojektilaji'] = searchProps['inventointiprojektilaji'];
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
                        
                        
                        angular.extend($scope.inventointiprojektitTable.filter(), filter);
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
                    
                    /*
                     * InventointiprojektiTyyppi
                     */
                    $scope.inventointiprojektityyppiOptions = [];

                    
                    $scope.getInventointiprojektiTyyppiOptions = function() {
                       ListService.getOptions('inventointiprojektityyppi').then(function success(options) {
                    	   $scope.inventointiprojektityyppiOptions = options;                    	   
                       }, function error(data) {
                    	   locale.ready('error').then(function() {
                    		   AlertService.showError(locale.getString("error.Getting_inventoryproject_type_options_failed"), AlertService.message(data));
                    	   });
                       });                    	
                    };
                    $scope.getInventointiprojektiTyyppiOptions();
                    
                    /*
                     * InventointiprojektiLaji
                     */
                    $scope.inventointiprojektilajiOptions = [];

                    $scope.getInventointiprojektiLajiOptions = function() {
                       ListService.getOptions('inventointiprojektilaji').then(function success(options) {
                    	   $scope.inventointiprojektilajiOptions = options;
                    	   
                    	   // default to Rakennusinventointi, assume id is always "1" - a bit of hazardous..
                           $scope.inventointiprojektitTable.filter().properties.inventointiprojektilaji = [1];
                       }, function error(data) {
                    	   locale.ready('error').then(function() {
                    		   AlertService.showError(locale.getString("error.Getting_inventoryproject_kind_options_failed"), AlertService.message(data));
                    	   });
                       });                    	
                    };
                    $scope.getInventointiprojektiLajiOptions();
                    
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

                        //Clear the alueCache
                        CacheFactory.get('inventointiprojektiCache').removeAll();
                        $scope.inventointiprojektitTable.reload();                  
                    };
                    
                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('inventointiprojektit');                    

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('inventointiprojektit', colName, value);
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
