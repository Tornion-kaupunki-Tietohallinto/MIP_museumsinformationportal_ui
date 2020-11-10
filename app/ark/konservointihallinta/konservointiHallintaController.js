/*
 * Konservoinnin hallinnan controller. Konservoinnin toimenpiteet, menetelmät ja materiaalit.
 */
angular.module('mip.konservointi.hallinta').controller('KonservointiHallintaController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'ModalService', 
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService',
		'KonservointiHallintaService', 'UserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, ModalService, 
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService,
				KonservointiHallintaService, UserService) {
			
			var vm = this;
			
            /**
             * Setup-metodi
             */
            vm.setUp = function() {
                
                angular.extend(vm, ListControllerService);

	             // Tabin asetus
	             vm.updateTabs('common.Archeology', 'ark.Concervation_control');
	                
			     vm.getColVisibilities('konservointi_hallinta_tab');
			     
			     // Käyttäjän roolin oikeus talteen
			     var props = UserService.getProperties();
			     vm.rooli = props.user.ark_rooli;
			     vm.oikeus = false;
			     if(vm.rooli === 'tutkija' || vm.rooli === 'pääkäyttäjä'){
			    	 vm.oikeus = true;
			     }
			     
			     // kenttien alkuarvot
			     vm.editToimenpide = null;
			     vm.editMenetelma = null;
			     vm.editMateriaali = null;
            };  
            locale.ready('common').then(function() {
                vm.setUp();                        
            });

			/**
			 * Toimenpiteet taulu
			 */
            vm.toimenpiteetTable = new NgTableParams({
                page : 1,
                count : 5,
                total : 25,                        
                filter : {
                	properties : {
                		menetelmat: []
                	}
                }
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                        	
                    filterParameters = ListService.parseParameters(params);

                    vm.toimenpiteetPromise = KonservointiHallintaService.haeToimenpiteet(filterParameters);
                    vm.toimenpiteetPromise.then(function(data) {
                    	                    	
                        if (data.count) {
                            vm.toimenpiteita = data.count;
                        } else {
                            vm.toimenpiteita = 0;
                        }
                        
                        params.total(data.total_count);
                        $defer.resolve(data.features);
                        
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        $defer.resolve([]);
                    });
                }
            });

            
            vm.lisaaToimenpide = function() {
            	var rivi = {properties: {'id': null, 'nimi': '', 'lisatiedot': '', 'aktiivinen': true}};
            	vm.toimenpiteetTable.data.push(rivi);
            	vm.muokkaaToimenpide(rivi)
            };
            
            vm.muokkaaToimenpide = function (rivi) {
            	vm.originalToimenpide = angular.copy(rivi);
            	vm.editToimenpide = rivi;
            };
            
            vm.tallennaToimenpide = function() {
            	if(vm.editToimenpide !== null) {
            		KonservointiHallintaService.luoTallennaToimenpide(vm.editToimenpide).then(function success(data) {
                        AlertService.showInfo(locale.getString('common.Save_ok'), "");
            			vm.toimenpiteetTable.reload();
            			vm.editToimenpide = null;
            		}, function error(data) {
            			AlertService.showInfo(locale.getString('common.Error'));
            		});
            	}
            };
            
            vm.peruutaToimenpide = function(toimenpide) {
            	// Toimenpide joka äsken lisättiin
            	if(toimenpide.properties.id === null) {
            		vm.toimenpiteetTable.data.pop();
            	}
            	vm.toimenpiteetTable.reload();
            	vm.editToimenpide = null;
            }
            
            vm.poistaToimenpide = function(toimenpide) {
            	var conf = confirm(locale.getString('common.Confirm_delete'));
                if (conf) {
                	KonservointiHallintaService.poistaToimenpide(toimenpide).then(function() {
                        AlertService.showInfo(locale.getString('common.Deleted'));
                        vm.toimenpiteetTable.reload();
                    });
                }
            };
            
			/*
			 *  Toimenpiteen nimen oltava uniikki
			 */
			vm.uniikkiToimenpide = true;
			vm.tarkistaUniikkiToimenpide = function (form) {
				if(vm.editToimenpide.properties.nimi){
					var available = KonservointiHallintaService.tarkistaToimenpide(vm.editToimenpide.properties.nimi).then(function success (data) {
						if (data) {
							form.toimenpideNimi.$setValidity('kaytossa', true);
							vm.uniikkiToimenpide = true;
						} else {
							form.toimenpideNimi.$setValidity('kaytossa', false);
							vm.uniikkiToimenpide = false;
						}
					});
					return available;
				}
			};

			/**
			 * Menetelmät taulu
			 */
            vm.menetelmatTable = new NgTableParams({
                page : 1,
                count : 5,
                total : 25,                        
                filter : {
                	properties : {
                		toimenpiteet: []
                	}
                }
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                        	
                    filterParameters = ListService.parseParameters(params);

                    vm.menetelmatPromise = KonservointiHallintaService.haeMenetelmat(filterParameters);
                    vm.menetelmatPromise.then(function(data) {
                    	                    	
                        if (data.count) {
                            vm.menetelmia = data.count;
                        } else {
                            vm.menetelmia = 0;
                        }
                        
                        params.total(data.total_count);
                        $defer.resolve(data.features);
                        
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        $defer.resolve([]);
                    });
                }
            });

            
            vm.lisaaMenetelma = function() {
            	var menetelma = {properties: {'id': null, 'nimi': '', 'kuvaus': '', 'aktiivinen': true}};
            	vm.menetelmatTable.data.push(menetelma);
            	vm.muokkaaMenetelma(menetelma)
            };
            
            vm.muokkaaMenetelma = function (rivi) {
            	vm.originalMenetelma = angular.copy(rivi);
            	vm.editMenetelma = rivi;
            };
            
            vm.tallennaMenetelma = function() {
            	if(vm.editMenetelma !== null) {
            		KonservointiHallintaService.luoTallennaMenetelma(vm.editMenetelma).then(function success(data) {
                        AlertService.showInfo(locale.getString('common.Save_ok'), "");
            			vm.menetelmatTable.reload();
            			vm.editMenetelma = null;
            		}, function error(data) {
            			AlertService.showInfo(locale.getString('common.Error'));
            		});
            	}
            };
            
            vm.peruutaMenetelma = function(menetelma) {
            	// menetelma joka äsken lisättiin
            	if(menetelma.properties.id === null) {
            		vm.menetelmatTable.data.pop();
            	}
            	vm.menetelmatTable.reload();
            	vm.editMenetelma = null;
            }
            
            vm.poistaMenetelma = function(menetelma) {
            	var conf = confirm(locale.getString('common.Confirm_delete'));
                if (conf) {
                	KonservointiHallintaService.poistaMenetelma(menetelma).then(function() {
                        AlertService.showInfo(locale.getString('common.Deleted'));
                        vm.menetelmatTable.reload();
                    });
                }
            };
            
			/*
			 *  Menetelmän nimen oltava uniikki
			 */
			vm.uniikkiMenetelma = true;
			vm.tarkistaUniikkiMenetelma = function (form) {
				if(vm.editMenetelma.properties.nimi){
					var available = KonservointiHallintaService.tarkistaMenetelma(vm.editMenetelma.properties.nimi).then(function success (data) {
						if (data) {
							form.menetelmaNimi.$setValidity('kaytossa', true);
							vm.uniikkiMenetelma = true;
						} else {
							form.menetelmaNimi.$setValidity('kaytossa', false);
							vm.uniikkiMenetelma = false;
						}
					});
					return available;
				}
			};
			
			/**
			 * Materiaalit taulu
			 */
            vm.materiaalitTable = new NgTableParams({
                page : 1,
                count :5,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                        	
                	filterParameters = ListService.parseParameters(params);
                    
                	if(vm.promise !== undefined) {
                        vm.cancelRequest();
                    }
                    
                    vm.materiaalitPromise = KonservointiHallintaService.haeMateriaalit(filterParameters);
                    vm.materiaalitPromise.then(function(data) {
                    	                    	
                        if (data.count) {
                            vm.searchResults = data.count;
                        } else {
                            vm.searchResults = 0;
                        }
                        
                        params.total(data.total_count);
                        $defer.resolve(data.features);
                        
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        $defer.resolve([]);
                    });
                }
            });

            vm.lisaaMateriaali = function() {
            	var materiaali = {properties: {'id': null, 'nimi': '', 'kemiallinen_kaava': '', 'muut_nimet': '', 'lisatiedot': '', 'aktiivinen': true}};
            	vm.materiaalitTable.data.push(materiaali);
            	vm.muokkaaMateriaali(materiaali)
            };
            
            vm.muokkaaMateriaali = function (rivi) {
            	vm.originalMateriaali = angular.copy(rivi);
            	vm.editMateriaali = rivi;
            };
            
            vm.tallennaMateriaali = function() {
            	if(vm.editMateriaali !== null) {
            		KonservointiHallintaService.luoTallennaMateriaali(vm.editMateriaali).then(function success(data) {
                        AlertService.showInfo(locale.getString('common.Save_ok'), "");
            			vm.materiaalitTable.reload();
            			vm.editMateriaali = null;
            		}, function error(data) {
            			AlertService.showInfo(locale.getString('common.Error'));
            		});
            		vm.materiaalitTable.reload();
            		vm.editMateriaali = null;
            	}
            };
            
            vm.peruutaMateriaali = function(materiaali) {
            	// Materiaali pois listalta joka äsken lisättiin
            	if(materiaali.properties.id === null) {
            		vm.materiaalitTable.data.pop();
            	} 
            	vm.materiaalitTable.reload();
            	vm.editMateriaali = null;
            }
            
            vm.poistaMateriaali = function(materiaali) {
            	var conf = confirm(locale.getString('common.Confirm_delete'));
                if (conf) {
                	KonservointiHallintaService.poistaMateriaali(materiaali).then(function() {
                        AlertService.showInfo(locale.getString('common.Deleted'));
                        vm.materiaalitTable.reload();
                    });
                }
            };
            
			/*
			 *  Materiaalin nimen oltava uniikki
			 */
			vm.uniikkiMateriaali = true;
			vm.tarkistaUniikkiMateriaali = function (form) {
				if(vm.editMateriaali.properties.nimi){
					var available = KonservointiHallintaService.tarkistaMateriaali(vm.editMateriaali.properties.nimi).then(function success (data) {
						if (data) {
							form.materiaaliNimi.$setValidity('kaytossa', true);
							vm.uniikkiMateriaali = true;
						} else {
							form.materiaaliNimi.$setValidity('kaytossa', false);
							vm.uniikkiMateriaali = false;
						}
					});
					return available;
				}
			};

			/*
			 * Päivitetään taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {                        

                if (data.type === 'toimenpide' || data.type === 'menetelma') {
                    vm.toimenpiteetTable.reload();
                    vm.menetelmatTable.reload();
                }
                if (data.type === 'materiaali') {
                    vm.materiaalitTable.reload();
                }

            });
			
			vm.curLocale = locale.getLocale();

            
            /*
             * Tyhjennä hakukriteerit
             */
            vm.tyhjennaHaku = function(table) {
            	if(table === 'materiaali'){
                	vm.materiaalitTable.filter().properties.nimi = '';
                	vm.materiaalitTable.filter().properties.kemiallinen_kaava = '';
                	vm.materiaalitTable.filter().properties.muut_nimet = '';
            	}
            	if(table === 'toimenpide'){
                	vm.toimenpiteetTable.filter().properties.nimi = '';
                	// todo menetelmähaku
            	}
            	if(table === 'menetelma'){
                	vm.menetelmatTable.filter().properties.nimi = '';
                	// todo toimenpiteethaku
            	}
            };
            
        	vm.kyllaEi = [
                    {
                        value : false,
                        label : locale.getString('common.No')
                    }, {
                        value : true,
                        label : locale.getString('common.Yes')
                    }
            ];

			
		}
]);
