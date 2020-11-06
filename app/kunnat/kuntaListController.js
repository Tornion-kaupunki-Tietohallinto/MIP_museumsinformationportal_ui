/*
 * Controller for listing the kunnat
 */
angular.module('mip.kunta').controller(
		'KuntaListController',
		[
				'$scope', 'TabService', '$filter', 'NgTableParams', 'CONFIG', 'ModalService', 'AlertService', 'KuntaService', '$location', 'ListService', 'locale', 'Auth', '$rootScope', 'MapService', 'CacheFactory', 'EntityBrowserService', 'UserService',
				function($scope, TabService, $filter, NgTableParams, CONFIG, ModalService, AlertService, KuntaService, $location, ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, UserService) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Counties'));
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
					 * TABLE FOR LISTING KUNNAT
					 */
                    var filterParameters = null;
					$scope.kunnatTable = new NgTableParams({
						page : 1,
						count : 50,
						total : 25,
						filter: {
							properties: {
								kuntaId: null
							}
						}
					}, {
						defaultSort : "asc",
						getData : function($defer, params) {
							Auth.checkPermissions("rakennusinventointi", "kunta").then(function(permissions) {
								if (permissions.luonti) {
									$scope.showCreateNewButton = true;
								}

								if (permissions.katselu) {
									// Create object with the currently selected filters. Used for generating the url.
									filterParameters = ListService.parseParameters(params);

									if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }

									 //Save the search parameters to the service.
                                    ListService.saveKuntaSearchParameters(filterParameters);


                                    $scope.promise = KuntaService.getKunnat(filterParameters);
                                    $scope.promise.then(function(data) {

									    if (data.count) {
                                            $scope.searchResults = data.count;
                                        } else {
                                            $scope.searchResults = 0;
                                        }
									    // no sorting, it is done in backend
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
										locale.ready('county').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('county.No_view_permission'));
										});
									});
								}
							});
						}
					});

					/*
					 * Select a kunta for editing.
					 */
					$scope.selectKunta = function(kunta) {
						if (!kunta) {
                            EntityBrowserService.setQuery('kunta', null, filterParameters, 1);
							ModalService.kuntaModal(false, null);
						} else {
							KuntaService.fetchKunta(kunta.properties.id).then(function(kunta) {
							    EntityBrowserService.setQuery('kunta', kunta.properties.id, filterParameters, $scope.kunnatTable.total());
                                ModalService.kuntaModal(true, kunta);
							});
						}
					}

					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};

					$scope.$on('Update_data', function(event, data) {
                        if (data.type == 'kunta') {
                            $scope.kunnatTable.reload();
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
                        if (searchProps['kun_jarjestys'] && searchProps['kun_jarjestys_suunta']) {
                        	$scope.kunnatTable.sorting(searchProps['kun_jarjestys'], searchProps['kun_jarjestys_suunta']);
                        }
                        if (searchProps['kuntaId']) {
                            filter['properties']['kuntaId'] = searchProps['kuntaId'];
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

                        angular.extend($scope.kunnatTable.filter(), filter);
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
                     * Refresh the table data
                     */
                    $scope.refreshTable = function() {

                        //Clear the cache
                        CacheFactory.get('kuntaCache').removeAll();
                        $scope.kunnatTable.reload();
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