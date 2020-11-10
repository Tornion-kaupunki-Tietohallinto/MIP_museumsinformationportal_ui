/* 
 * Controller for listing the matkaraportit
 */
angular.module('mip.matkaraportti').controller('MatkaraporttiListController', [
        '$scope', 'TabService', '$filter', 'NgTableParams', 'CONFIG', 'ModalService', 'AlertService', 'MatkaraporttiService', 'ListService', 'locale', 'Auth', '$rootScope', 'CacheFactory', 'UserService', '$location', 'SessionService', 'EntityBrowserService',
        function($scope, TabService, $filter, NgTableParams, CONFIG, ModalService, AlertService, MatkaraporttiService, ListService, locale, Auth, $rootScope, CacheFactory, UserService, $location, SessionService, EntityBrowserService) {
            /*
             * TAB BAR
             */
            locale.ready('common').then(function() {
                $rootScope.setActiveTab(locale.getString('common.Building_inventory'));
                $rootScope.setActiveSubTab(locale.getString('common.Travel_reports'));
            });

            // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
            $scope.userRole = UserService.getProperties().user.rooli;
            
            // Redirect unauthorized user
            if($scope.userRole != 'pääkäyttäjä' && $scope.userRole != 'inventoija' && $scope.userRole != 'tutkija') {                        
                $location.path(SessionService.getDestination()); 
            }                    
            
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
             * LISTING TABLE
             */
            var filterParameters = null;
            $scope.matkaraportitTable = new NgTableParams({
                page : 1,
                count : 25,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                    Auth.checkPermissions('rakennusinventointi', 'matkaraportti').then(function success(permissions) {
                        /*
                         * If the user is paakayttaja
                         */
                        if (permissions.katselu) {
                            filterParameters = ListService.parseParameters(params);                            

                            if($scope.promise !== undefined) {
                                $scope.cancelRequest();
                            }
                            
                            //Save the search parameters to the service.
                            ListService.saveMatkaraporttiSearchParameters(filterParameters);

                            $scope.promise = MatkaraporttiService.getMatkaraportit(filterParameters);
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
                                var orderedData = [];
                                $defer.resolve(orderedData);
                            });
                        } else {
                            var orderedData = [];

                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), locale.getString('common.No_view_permission'));
                            });

                            $defer.resolve(orderedData);
                        }
                    });
                }
            });

            /*
             * When user is selected from the list or a new one is being created
             */
            $scope.selectMatkaraportti = function(matkaraportti) {
                if (!matkaraportti) {
                    EntityBrowserService.setQuery('matkaraportti', null, filterParameters, 1);                    
                    ModalService.matkaraporttiModal(null);
                } else {
                        MatkaraporttiService.fetchMatkaraportti(matkaraportti.properties.id).then(function success(matkaraportti) {
                            EntityBrowserService.setQuery('matkaraportti', matkaraportti.properties.id, filterParameters, $scope.matkaraportitTable.total());
                            ModalService.matkaraporttiModal(matkaraportti, true);
                        });
                }
            };

            $scope.getColumnName = function(column) {
                if(column.indexOf('.') > 0) {
                    var langFile = column.split('.')[0];
                    var col = column.split('.')[1];
                    return ListService.getColumnName(col, langFile);
                }
                return ListService.getColumnName(column);                
            };
            
            /*
             * FETCH SEARCH PARAMS Get the search parameters from the service and assign them automatically
             */
            $scope.getSearchValues = function() {
                var searchProps = ListService.getProps();
                var filter = {
                    'properties' : {}
                };

                if (searchProps['mat_jarjestys'] && searchProps['mat_jarjestys_suunta']) {
                	$scope.matkaraportitTable.sorting(searchProps['mat_jarjestys'], searchProps['mat_jarjestys_suunta']);
                }              
                if (searchProps['kayttajaEtunimi']) {
                    filter['properties']['etunimi'] = searchProps['kayttajaEtunimi'];
                }
                if (searchProps['kayttajaSukunimi']) {
                    filter['properties']['sukunimi'] = searchProps['kayttajaSukunimi'];
                }
                
                if (searchProps['kiinteistotunnus']) {
                    filter['properties']['kiinteistotunnus'] = searchProps['kiinteistotunnus'];
                }
                if (searchProps['kiinteistoNimi']) {
                    filter['properties']['kiinteistoNimi'] = searchProps['kiinteistoNimi'];
                }
                if(searchProps['palstanumero']) {
                    filter['properties']['palstanumero'] = searchProps['palstanumero'];
                }
                
                if (searchProps['matkaraportinSyy']) {
                    filter['properties']['syy'] = searchProps['matkaraportinSyy'];
                }
                
                if (searchProps['matkapvm_aloitus']) {
                    filter['properties']['matkapvm_aloitus'] = searchProps['matkapvm_aloitus'];
                }
                if (searchProps['matkapvm_lopetus']) {
                    filter['properties']['matkapvm_lopetus'] = searchProps['matkapvm_lopetus'];
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

                angular.extend($scope.matkaraportitTable.filter(), filter);
            };
            $scope.getSearchValues();
            
            /*
             * Clear the save search properties from the service and reapply the cleared filters.
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
                CacheFactory.get('matkaraporttiCache').removeAll();
                $scope.matkaraportitTable.reload();                  
            };
            
            $scope.$on('Update_data', function(event, data) {                        
                if (data.type == 'matkaraportti') {
                    $scope.matkaraportitTable.reload();                    
                }
            });
            
            /*
             * Matkaraportinsyy
             */
            $scope.syyOptions = [];

            $scope.getSyyOptions = function() {
               ListService.getOptions('matkaraportinsyy').then(function success(options) {
                   $scope.syyOptions = options;                          
               }, function error() {
                   locale.ready('error').then(function() {
                       AlertService.showError(locale.getString('common.Get_selection_list_failed', {
                           cat : locale.getString('common.Reasons')
                       }));
                   });
               });                      
            };
            $scope.getSyyOptions();

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
             * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
             */
            $scope.colVisibilities = ListService.getColumnVisibility('matkaraportit');                    

            $scope.saveColVisibility = function(colName, value) {
                ListService.setColumnVisibility('matkaraportit', colName, value);
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
