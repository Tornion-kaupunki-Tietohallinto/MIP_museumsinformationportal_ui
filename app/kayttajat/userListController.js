/*
 * Controller for user listing. 
 */
angular.module('mip.user', [
        'mip.menu', 'mip.auth'
]);

angular.module('mip.user').controller(
        'UserListController',
        [
                '$scope', '$http', 'CONFIG', 'UserService', '$q', 'TabService', '$location', '$filter', 'NgTableParams', 'ModalService', 'ListService', 'AlertService', 'locale', '$rootScope', 'Auth', 'SessionService', 'EntityBrowserService',
                function($scope, $http, CONFIG, UserService, $q, TabService, $location, $filter, NgTableParams, ModalService, ListService, AlertService, locale, $rootScope, Auth, SessionService, EntityBrowserService) {
                    /*
                     * TAB BAR
                     */
                    locale.ready('common').then(function() {
                        $rootScope.setActiveTab(locale.getString('common.Administration'));
                        $rootScope.setActiveSubTab(locale.getString('common.Users'));
                    });

                    // will be set to true later if appropriate
                    $scope.showCreateNewButton = false;
                    $scope.isPaakayttaja = false;

                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;
                    
                    // Redirect unauthorized user
                    if($scope.userRole != 'pääkäyttäjä') {                        
                        $location.path(SessionService.getDestination()); 
                    }                    
                    
                    /* 
                     * Is the user paakayttaja or not (allow listing users and show the create new button)? We can't use the permission check for the users, as everyone has permission to get the users, but only paakayttaja has permission to see them in this view and open the user's properties
                     */
                    $scope.isPaakayttajaFunc = function() {
                        // Get only the inventor's inventory projects
                        var role = $filter('uppercase')($scope.userRole);

                        angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                            // Below is the U+1F44D way to check. Here is a hack U+1F644
                            if (value == 5 && role == key || value == 5 && role == 'PÄÄKÄYTTÄJÄ') {
                                $scope.isPaakayttaja = true;
                                $scope.showCreateNewButton = true;
                            }
                        });
                    };
                    $scope.isPaakayttajaFunc();

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
                     * USER LISTING TABLE
                     */
                    $scope.usersTable = new NgTableParams({
                        page : 1,
                        count : 25,
                        total : 25
                    }, {
                        defaultSort : "asc",
                        getData : function($defer, params) {

                            Auth.checkPermissions('rakennusinventointi', 'kayttaja').then(function success(permissions) {
                                /*
                                 * If the user is paakayttaja
                                 */
                                if (permissions.katselu) {
                                    filterParameters = ListService.parseParameters(params);

                                    if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }
                                    
                                    // Save the search parameters to the service.
                                    ListService.saveKayttajaSearchParameters(filterParameters);

                                    $scope.promise = UserService.getUsers(filterParameters);
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
                                        AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                    });

                                    $defer.resolve(orderedData);
                                }
                            });
                        }
                    });

                    /*
                     * When user is selected from the list or a new one is being created
                     */
                    $scope.selectUser = function(user) {
                        if (!user) {
                            EntityBrowserService.setQuery('kayttaja', null, filterParameters, 1);
                            ModalService.userModal(null);
                        } else {
                            if ($scope.isPaakayttaja) { // Only admin can view the users
                                UserService.getUser(user.properties.id).then(function success(user) {
                                    EntityBrowserService.setQuery('kayttaja', user.id, filterParameters, $scope.usersTable.total());
                                    ModalService.userModal(user);
                                });
                            }
                        }
                    }

                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    }

                    // Options for aktiivinen filter. We can't use the listService getNoYes as the values aren't string --> false value doesn't go to the filter for some reason. Also we add empty to "disable" the filtering.
                    $scope.noYes = [
                            {
                                value : '',
                                label : locale.getString('common.Active') + ': ' + locale.getString('common.All')
                            }, {
                                value : 'false',
                                label : locale.getString('common.Active') + ': ' + locale.getString('common.No')
                            }, {
                                value : 'true',
                                label : locale.getString('common.Active') + ': ' + locale.getString('common.Yes')
                            }
                    ];

                    $scope.setActiveDefaultValue = function() {
                        // Set the default value for the aktiivinen filter
                        if ($scope.usersTable.filter().properties != null) {
                            if ($scope.usersTable.filter().properties.aktiivinen == null) {
                                $scope.usersTable.filter().properties['aktiivinen'] = '';
                            }
                        } else {
                            $scope.usersTable.filter().properties = {};
                            $scope.usersTable.filter().properties['aktiivinen'] = 'true';
                        }
                    }

                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'kayttaja') {
                            $scope.usersTable.reload();
                        }
                    });

                    /*
                     * FETCH SEARCH PARAMS Get the search parameters from the service and assign them automatically
                     */
                    $scope.getSearchValues = function() {
                        var searchProps = ListService.getProps();
                        var value = "";
                        var filter = {
                            'properties' : {}
                        };
                        if (searchProps['kay_jarjestys'] && searchProps['kay_jarjestys_suunta']) {
                        	$scope.usersTable.sorting(searchProps['kay_jarjestys'], searchProps['kay_jarjestys_suunta']);
                        }
                        if (searchProps['kayttajaEtunimi']) {
                            filter['properties']['etunimi'] = searchProps['kayttajaEtunimi'];
                        }
                        if (searchProps['kayttajaSukunimi']) {
                            filter['properties']['sukunimi'] = searchProps['kayttajaSukunimi'];
                        }

                        if (searchProps['sahkoposti']) {
                            filter['properties']['sahkoposti'] = searchProps['sahkoposti'];
                        }
                        if (searchProps['organisaatio']) {
                            filter['properties']['organisaatio'] = searchProps['organisaatio'];
                        }
                        if (searchProps['aktiivinen']) {
                            filter['properties']['aktiivinen'] = searchProps['aktiivinen'];
                        }

                        angular.extend($scope.usersTable.filter(), filter);
                    }
                    $scope.getSearchValues();
                    $scope.setActiveDefaultValue()
                    /*
                     * Clear the save search properties from the service and reapply the cleared filters.
                     */
                    $scope.clearSearchFilter = function() {
                        ListService.clearProps();
                        $scope.getSearchValues();
                       
                        $scope.setActiveDefaultValue()
                    };
                    
                    /*
                     * Refresh the table data
                     */            
                    $scope.refreshTable = function() {

                        $scope.usersTable.reload();                  
                    };
                    
                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('kayttajat');                    

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('kayttajat', colName, value);
                    };
                    /*
                     * END Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    
                    
}]);
