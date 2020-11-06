/*
 * Controller for the rakennukset list
 */
angular.module('mip.rakennus').controller(
		'RakennusListController',
		[
				'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'RakennusService',
				'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', '$rootScope', 'SuunnittelijaService',
				'MapService', 'CacheFactory', 'KuntaService', 'KylaService', '$q','EntityBrowserService', 'InventointiprojektiService', 'UserService', 'KoriService',
				function($scope, TabService, $location, CONFIG, $filter, NgTableParams, RakennusService,
				        ModalService, AlertService, ListService, locale, Auth, $rootScope, SuunnittelijaService,
				        MapService, CacheFactory, KuntaService, KylaService, $q, EntityBrowserService, InventointiprojektiService, UserService, KoriService) {

					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Building_inventory'));
						$rootScope.setActiveSubTab(locale.getString('common.Buildings'));
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
					 * TABLE FOR LISTING KIINTEISTOT
					 */
					$scope.rakennuksetTable = new NgTableParams({
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
							Auth.checkPermissions("rakennusinventointi", "rakennus").then(function(permissions) {
								if (permissions.katselu) {
									filterParameters = ListService.parseParameters(params);

									if($scope.promise !== undefined) {
                                        $scope.cancelRequest();
                                    }

									 //Save the search parameters to the service.
                                    ListService.saveRakennusSearchParameters(filterParameters);

                                    $scope.promise = RakennusService.getRakennukset(filterParameters);
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
										locale.ready('building').then(function() {
											AlertService.showError(locale.getString('common.Error'), locale.getString('building.No_view_permission'));
										});
									});
								}
							});
						}
					});

					$scope.selectRakennus = function(rakennus) {
						if (!rakennus) {//Should not be possible
						    EntityBrowserService.setQuery('rakennus', null, filterParameters, 1);
							ModalService.rakennusModal(false, null, null, null);
						} else {
							RakennusService.fetchRakennus(rakennus.properties.id).then(function(rakennus) {
							    EntityBrowserService.setQuery('rakennus', rakennus.properties.id, filterParameters, $scope.rakennuksetTable.total());
							    ModalService.rakennusModal(true, rakennus, null, null);
							}, function error(data) {
								locale.ready('error').then(function() {
									AlertService.showError(locale.getString('error.Getting_building_failed'));
								});
							});
						}
					};

					$scope.getColumnName = function(column) {
						return ListService.getColumnName(column);
					};

					$scope.$on('Update_data', function(event, data) {
                        if (data.type == 'rakennus') {
                            $scope.rakennuksetTable.reload();
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

                    /**
                     * Avaa korin hakutulosten lisäämisen ikkunaan. Välitetään lista haetuista id:stä
                     */
                    $scope.lisaaKoriin = function(){
                    	// Haetaan rakennusten korityyppi
                    	$scope.koriPromise = KoriService.haeKorityyppi('rakennus');
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
                        if (searchProps['rak_jarjestys'] && searchProps['rak_jarjestys_suunta']) {
                        	$scope.rakennuksetTable.sorting(searchProps['rak_jarjestys'], searchProps['rak_jarjestys_suunta']);
                        }
                        if (searchProps['kuntaId']) {
                            filter['properties']['kuntaId'] = searchProps['kuntaId'];
                        }
                        if (searchProps['kylaId']) {
                            filter['properties']['kylaId'] = searchProps['kylaId'];
                        }

                        if (searchProps['kiinteistotunnus']) {
                            filter['properties']['kiinteistotunnus'] = searchProps['kiinteistotunnus'];
                        }

                        if (searchProps['kiinteistoNimi']) {
                            filter['properties']['kiinteisto_nimi'] = searchProps['kiinteistoNimi'];
                        }

                        if (searchProps['osoite']) {
                            filter['properties']['rakennus_osoite'] = searchProps['osoite'];
                        }

                        if (searchProps['rakennustyyppi']) {
                            filter['properties']['rakennustyyppi'] = searchProps['rakennustyyppi'];
                        }

                        if(searchProps['palstanumero']) {
                            filter['properties']['palstanumero'] = searchProps['palstanumero'];
                        }

                        if (searchProps['arvotus']) {
                            filter['properties']['arvotus'] = searchProps['arvotus'];
                        }
                        if(searchProps['etunimi'] && searchProps['sukunimi']) {
                            filter['properties']['suunnittelija'] = searchProps['sukunimi']+ " " + searchProps['etunimi'];
                        } else {
                            if (searchProps['suunnittelija']) {
                                filter['properties']['suunnittelija'] = searchProps['suunnittelija'];
                            }
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

                        if (searchProps['rakennustunnus']) {
                            filter['properties']['rakennustunnus'] = searchProps['rakennustunnus'];
                        }
                        if (searchProps['rakennustyypin_kuvaus']) {
                            filter['properties']['rakennustyypin_kuvaus'] = searchProps['rakennustyypin_kuvaus'];
                        }
                        if (searchProps['rakennusvuosi_alku']) {
                            filter['properties']['rakennusvuosi_alku'] = searchProps['rakennusvuosi_alku'];
                        }
                        if (searchProps['rakennusvuosi_lopetus']) {
                            filter['properties']['rakennusvuosi_lopetus'] = searchProps['rakennusvuosi_lopetus'];
                        }
                        if (searchProps['muutosvuosi_alku']) {
                            filter['properties']['muutosvuosi_alku'] = searchProps['muutosvuosi_alku'];
                        }
                        if (searchProps['muutosvuosi_lopetus']) {
                            filter['properties']['muutosvuosi_lopetus'] = searchProps['muutosvuosi_lopetus'];
                        }
                        if (searchProps['rakennusvuosi_kuvaus']) {
                            filter['properties']['rakennusvuosi_kuvaus'] = searchProps['rakennusvuosi_kuvaus'];
                        }
                        if (searchProps['muutosvuosi_kuvaus']) {
                            filter['properties']['muutosvuosi_kuvaus'] = searchProps['muutosvuosi_kuvaus'];
                        }
                        if (searchProps['alkuperainen_kaytto']) {
                            filter['properties']['alkuperainen_kaytto'] = searchProps['alkuperainen_kaytto'];
                        }
                        if (searchProps['nykykaytto']) {
                            filter['properties']['nykykaytto'] = searchProps['nykykaytto'];
                        }
                        if (searchProps['perustus']) {
                            filter['properties']['perustus'] = searchProps['perustus'];
                        }
                        if (searchProps['runko']) {
                            filter['properties']['runko'] = searchProps['runko'];
                        }
                        if (searchProps['vuoraus']) {
                            filter['properties']['vuoraus'] = searchProps['vuoraus'];
                        }
                        if (searchProps['katto']) {
                            filter['properties']['katto'] = searchProps['katto'];
                        }
                        if (searchProps['kate']) {
                            filter['properties']['kate'] = searchProps['kate'];
                        }
                        if (searchProps['kunto']) {
                            filter['properties']['kunto'] = searchProps['kunto'];
                        }
                        if (searchProps['nykytyyli']) {
                            filter['properties']['nykytyyli'] = searchProps['nykytyyli'];
                        }
                        if (searchProps['purettu']) {
                            filter['properties']['purettu'] = searchProps['purettu'];
                        }
                        if (searchProps['kuvaukset']) {
                            filter['properties']['kuvaukset'] = searchProps['kuvaukset'];
                        }
                        if (searchProps['kulttuurihistorialliset_arvot']) {
                            filter['properties']['kulttuurihistorialliset_arvot'] = searchProps['kulttuurihistorialliset_arvot'];
                        }

                        angular.extend($scope.rakennuksetTable.filter(), filter);
                    }
                    $scope.getSearchValues();

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

                        //Clear the cache
                        CacheFactory.get('rakennusCache').removeAll();
                        $scope.rakennuksetTable.reload();
                    };

                    $scope.removeAluerajaus = function() {
                        ListService.setProp('polygonrajaus', '');
                        ListService.setProp('aluerajaus', '');
                        $scope.getSearchValues();
                    };

                    $scope.currentLocale = locale.getLocale();

                    /*
                     * BEGIN Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */
                    $scope.colVisibilities = ListService.getColumnVisibility('rakennukset');

                    $scope.saveColVisibility = function(colName, value) {
                        ListService.setColumnVisibility('rakennukset', colName, value);
                    };
                    /*
                     * END Column visibility functionality - Sarakkeiden näytä / piilota toiminnallisuus
                     */

                    /*
                     * Valintalistojen arvojen haku
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

                    $scope.suunnittelijat = [];
                    $scope.getSuunnittelijat = function(search) {
                        $scope.suunnittelijat.length = 0;
                        var s = {
                            'rivit' : 20,
                            'jarjestys' : 'nimi',
                        };
                        if (search) {
                            s['nimi'] = search;
                        }

                        SuunnittelijaService.getSuunnittelijat(s).then(function success(suunnittelijat) {
                            for (var i = 0; i < suunnittelijat.features.length; i++) {
                                $scope.suunnittelijat.push(suunnittelijat.features[i].properties);
                            }
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                            })
                        });
                    };
                    $scope.getSuunnittelijat();

                    /* Alkuperainen kaytto */
                    $scope.alkuperainen_kayttoOptions = [];
                    $scope.getAlkuperaisetkaytotOptions = function() {
                        if ($scope.create || $scope.alkuperainen_kayttoOptions.length == 0) {
                            ListService.getOptions('kayttotarkoitus').then(function success(options) {
                                $scope.alkuperainen_kayttoOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_originalusage_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAlkuperaisetkaytotOptions();

                    /* Nykykaytto */
                    $scope.nykykayttoOptions = [];
                    $scope.getNykykaytotOptions = function() {
                        if ($scope.create || $scope.nykykayttoOptions.length == 0) {
                            ListService.getOptions('kayttotarkoitus').then(function success(options) {
                                $scope.nykykayttoOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_currentusage_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getNykykaytotOptions();

                    /* Perustustyyppi */
                    $scope.perustusOptions = [];
                    $scope.getPerustustyyppiOptions = function() {
                        if ($scope.create || $scope.perustusOptions.length == 0) {
                            ListService.getOptions('perustus').then(function success(options) {
                                $scope.perustusOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_foundation_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getPerustustyyppiOptions();

                    /* Runkotyyppi */
                    $scope.runkoOptions = [];
                    $scope.getRunkotyyppiOptions = function() {
                        if ($scope.create || $scope.runkoOptions.length == 0) {
                            ListService.getOptions('runko').then(function success(options) {
                                $scope.runkoOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_frame_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getRunkotyyppiOptions();

                    /* Vuoraustyyppi */
                    $scope.vuorausOptions = [];
                    $scope.getVuoraustyyppiOptions = function() {
                        if ($scope.create || $scope.vuorausOptions.length == 0) {
                            ListService.getOptions('vuoraus').then(function success(options) {
                                $scope.vuorausOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_lining_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getVuoraustyyppiOptions();

                    /* Kattotyyppi */
                    $scope.kattoOptions = [];
                    $scope.getKattotyyppiOptions = function() {
                        if ($scope.create || $scope.kattoOptions.length == 0) {
                            ListService.getOptions('kattotyyppi').then(function success(options) {
                                $scope.kattoOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_ceiling_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKattotyyppiOptions();

                    /* Katetyyppi */
                    $scope.kateOptions = [];
                    $scope.getKatetyyppiOptions = function() {
                        if ($scope.create || $scope.kateOptions.length == 0) {
                            ListService.getOptions('kate').then(function success(options) {
                                $scope.kateOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_cover_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKatetyyppiOptions();

                    /* Kuntotyyppi */
                    $scope.kuntoOptions = [];
                    $scope.getKuntotyyppiOptions = function() {
                        if ($scope.create || $scope.kuntoOptions.length == 0) {
                            ListService.getOptions('kunto').then(function success(options) {
                                $scope.kuntoOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_condition_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKuntotyyppiOptions();

                    /* Nykytyyli */
                    $scope.nykytyyliOptions = [];
                    $scope.getNykytyyliOptions = function() {
                        if ($scope.create || $scope.nykytyyliOptions.length == 0) {
                            ListService.getOptions('nykyinen_tyyli').then(function success(options) {
                                $scope.nykytyyliOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_contemporarystyle_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getNykytyyliOptions();

                    /* Purettu */
                    $scope.purettuOptions = [];
                    $scope.getPurettuOptions = function() {
                        $scope.purettuOptions = ListService.getNoYes();
                    };
                    $scope.getPurettuOptions();


                    /*
                     * Kulttuurihistorialliset arvot
                     */
                    $scope.kulttuurihistorialliset_arvotOptions = [];
                    $scope.getKulttuurihistoriallisetArvotOptions = function() {
                        ListService.getOptions('kulttuurihistoriallinenarvo', 'rakennus').then(function success(options) {
                            for (var i = 0; i < options.data.features.length; i++) {
                                var opt = options.data.features[i];
                                $scope.kulttuurihistorialliset_arvotOptions.push({
                                    id : opt.properties.id,
                                    nimi_fi : opt.properties.nimi_fi,
                                    nimi_se : opt.properties.nimi_se
                                });
                            }
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                            });
                        });
                    }
                    $scope.getKulttuurihistoriallisetArvotOptions();

				}
		]);
