/*
 * Controller for the kylat list
 */
angular.module('mip.kyla').controller(
		'KylaListController',
		[
				'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'KylaService', 'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', '$rootScope', 'MapService', 'CacheFactory', 'EntityBrowserService', 'UserService',
				function($scope, TabService, $location, CONFIG, $filter, NgTableParams, KylaService, ModalService, AlertService, ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, UserService) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Villages'));
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
					 * TABLE FOR LISTING KYLAT
					 */
                    var filterParameters = null;
					$scope.kylatTable = new NgTableParams({
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
							Auth.checkPermissions("rakennusinventointi", "kyla").then(function(permissions) {
								if (permissions.luonti) {
									$scope.showCreateNewButton = true;
								}

								if (permissions.katselu) {
									filterParameters = ListService.parseParameters(params);

									if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }

									//Save the search parameters to the service.
                                    ListService.saveKylaSearchParameters(filterParameters);


                                    $scope.promise = KylaService.getKylat(filterParameters);
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
										locale.ready('kyla').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('kyla.No_view_permission'));
										});
									});
								}
							});
						}
					});

					$scope.selectKyla = function(kyla) {
						if (!kyla) {
						    EntityBrowserService.setQuery('kyla', null, filterParameters, 1);
							ModalService.kylaModal(false, null);
						} else {
							KylaService.fetchKyla(kyla.properties.id).then(function(kyla) {
							    EntityBrowserService.setQuery('kyla', kyla.properties.id, filterParameters, $scope.kylatTable.total());
								ModalService.kylaModal(true, kyla);
							});
						}
					}

					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};

					$scope.$on('Update_data', function(event, data) {
                        if (data.type == 'kyla') {
                            $scope.kylatTable.reload();
                        }
                    });



                    /*
                     * Refresh the table data
                     */
                    $scope.refreshTable = function() {
                        //Clear the cache
                        CacheFactory.get('kylaCache').removeAll();
                        $scope.kylatTable.reload();
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
                        if (searchProps['kyl_jarjestys'] && searchProps['kyl_jarjestys_suunta']) {
                        	$scope.kylatTable.sorting(searchProps['kyl_jarjestys'], searchProps['kyl_jarjestys_suunta']);
                        }
                        if (searchProps['kuntaId']) {
                            filter['properties']['kuntaId'] = searchProps['kuntaId'];
                        }
                        if (searchProps['kylaId']) {
                            filter['properties']['kylaId'] = searchProps['kylaId'];
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

                        angular.extend($scope.kylatTable.filter(), filter);
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
				}
		]);
