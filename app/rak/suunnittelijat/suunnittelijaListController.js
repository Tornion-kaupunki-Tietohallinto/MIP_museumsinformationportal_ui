/*
 * Controller for the suunnittelijat list
 */
angular.module('mip.suunnittelija').controller(
        'SuunnittelijaListController',
        [
                '$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'SuunnittelijaService', 'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', '$rootScope', 'MapService', 'CacheFactory', 'EntityBrowserService', 'UserService',
                function($scope, TabService, $location, CONFIG, $filter, NgTableParams, SuunnittelijaService, ModalService, AlertService, ListService, locale, Auth, $rootScope, MapService, CacheFactory, EntityBrowserService, UserService) {
                    /*
                     * TAB BAR
                     */
                    locale.ready('common').then(function() {
                        $rootScope.setActiveTab(locale.getString('common.Building_inventory'));
                        $rootScope.setActiveSubTab(locale.getString('common.Architects'));
                    });

                    /*
                     * Set default layer for map page
                     */
                    MapService.setDefaultLayer("Rakennukset");

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
                     * TABLE FOR LISTING KIINTEISTOT
                     */
                    var filterParameters = null;
                    $scope.suunnittelijatTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25
                    // this dummy value will be overwritten by the data from the backend.
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "suunnittelija").then(function(permissions) {
                                if (permissions.luonti) {
                                    $scope.showCreateNewButton = true;
                                }

                                if (permissions.katselu) {
                                    filterParameters = ListService.parseParameters(params);

                                    if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }
                                    
                                    // Save the search parameters to the service.
                                    ListService.saveSuunnittelijaSearchParameters(filterParameters);

                                    $scope.promise = SuunnittelijaService.getSuunnittelijat(filterParameters);
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
                                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                                        });
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    });
                                } else {
                                    locale.ready('common').then(function() {
                                        locale.ready('designer').then(function() {
                                            AlertService.showError(locale.getString('common.Error'), locale.getString('designer.No_view_permission'));
                                        });
                                    });
                                }
                            });
                        }
                    });

                    $scope.selectSuunnittelija = function(suunnittelija) {
                        if (!suunnittelija) {                            
                            EntityBrowserService.setQuery('suunnittelija', null, filterParameters, 1);
                            ModalService.suunnittelijaModal(false, null);
                        } else {
                            SuunnittelijaService.fetchSuunnittelija(suunnittelija.properties.id).then(function(suunnittelija) {
                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, filterParameters, $scope.suunnittelijatTable.total());
                                ModalService.suunnittelijaModal(true, suunnittelija);
                            });
                        }
                    };

                    $scope.getColumnName = function(column) {
                        var c = column.split('.');
                        if (c.length == 2) {
                            return ListService.getColumnName(c[1], c[0]);
                        }
                        return ListService.getColumnName(column);
                    };

                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'suunnittelija') {
                            $scope.suunnittelijatTable.reload();
                        }
                    });

                    /*
                     * FETCH SEARCH PARAMS Get the search parameters from the service and assign them automatically
                     * Suunnittelijan haku rakennusvälilehdellä on haluttu muuttaa valintalistaksi, joten hakuparametreistä
                     * on poistettu nimien tallennukset.
                     */
                    $scope.getSearchValues = function() {
                        var searchProps = ListService.getProps();
                        var value = "";
                        var filter = {
                            'properties' : {}
                        };
                        if (searchProps['suu_jarjestys'] && searchProps['suu_jarjestys_suunta']) {
                        	$scope.suunnittelijatTable.sorting(searchProps['suu_jarjestys'], searchProps['suu_jarjestys_suunta']);
                        }
                        if (searchProps['suunnittelijaLaji']) {
                            filter['properties']['laji'] = searchProps['suunnittelijaLaji'];
                        }
                        if (searchProps['ammattiarvo']) {
                            filter['properties']['ammattiarvo'] = searchProps['ammattiarvo'];
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

                        angular.extend($scope.suunnittelijatTable.filter(), filter);
                    }
                    $scope.getSearchValues();
                    
                    /*
                     * Laji
                     */
                    $scope.lajit = [];
                    $scope.getLajit = function() {
                            ListService.getOptions('suunnittelijalaji').then(function success(lajit) {
                                $scope.lajit = lajit;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("common.Error"), AlertService.message(data));
                                });
                            });                        
                    };
                    $scope.getLajit();            
                    
                    /*
                     * Ammattiarvot
                     */
                    $scope.ammattiarvot = [];
                    $scope.getAmmattiarvot = function() {
                        if ($scope.create || $scope.ammattiarvot.length == 0) {
                            ListService.getOptions('suunnittelijaammattiarvo').then(function success(ammattiarvot) {
                                $scope.ammattiarvot = ammattiarvot;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("common.Error"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAmmattiarvot();
                    
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

                        //Clear the cache
                        CacheFactory.get('suunnittelijaCache').removeAll();
                        $scope.suunnittelijatTable.reload();                  
                    };

                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('suunnittelijat');                    

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('suunnittelijat', colName, value);
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
