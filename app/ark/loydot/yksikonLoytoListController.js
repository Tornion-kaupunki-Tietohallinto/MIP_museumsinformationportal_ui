/*
 * Yksikön löytöjen listaus controller
 */
angular.module('mip.loyto').controller('YksikonLoytoListController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'LoytoService', 'ModalService', 
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService', 'selectedModalNameId', 'ModalControllerService',
		'materiaalikoodi', 'yksikko', 'tutkimusalue', 'ajoitettu', 'permissions', 'EntityBrowserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, LoytoService, ModalService, 
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService, selectedModalNameId, ModalControllerService,
				materiaalikoodi, yksikko, tutkimusalue, ajoitettu, permissions, EntityBrowserService) {
			
			var vm = this;
			
            /**
             * Setup-metodi
             */
            vm.setUp = function() {
                
                angular.extend(vm, ListControllerService);
                angular.extend(vm, ModalControllerService);
                
                // Valitun modalin nimi ja järjestysnumero
                vm.modalNameId = selectedModalNameId;	                    
		        vm.setModalId();
                
		        vm.getColVisibilities('loyto');
		        
		        // yksikkö jolle löytö kuuluu
		        if(yksikko){
		        	vm.yksikko = yksikko;
		        }
                
            };  
            vm.setUp();
            
            /**
             * ModalHeader kutsuu scopesta closea
             */
            $scope.close = function() {
            	vm.close();
                $scope.$destroy();
            };

			/*
			 * Löydöt
			 */
            vm.loydotTable = new NgTableParams({
                page : 1,
                count : 50,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                        	
                    filterParameters = ListService.parseParameters(params);
                    
                    // Lisätään yksikön id hakuun
                    filterParameters['ark_tutkimusalue_yksikko_id'] = yksikko.properties.id;

                    // Asetetaan materiaalikoodien id arvot hakuun. Tämä näin toistaiseksi koska oletusarvon asetus monivalintaan tökkii.
                    var valitutKoodit = filterParameters.materiaalikoodit;
                    if(valitutKoodit){
                        var mKoodit = '';
                        
                        //Tässä tapahtuu jotain kummia, välillä (=ensimmäisellä kerralla) otetaan objektista id - arvo ja
                        //muilla (kun muutettu) otetaan suoraan materiaali
                        for (var i = 0; i < valitutKoodit.length; i++){
                            var materiaali = valitutKoodit[i];
                            if(materiaali['id']) {
                            	mKoodit = mKoodit + materiaali.id + ',';
                            } else {
                            	mKoodit = mKoodit + materiaali + ',';
                            }
                        }
                        // viimeinen pilkku pois
                        mKoodit = mKoodit.slice(0,-1);
                        
                        if(mKoodit){
                        	filterParameters['materiaalikoodit'] = mKoodit;
                        }
                    }
                    
                    // Löydön tila id:t hakuun
                    var valitutTilat = filterParameters.loydon_tilat;
                    if(valitutTilat){
                        var tilat = '';
                        
                        for (var i = 0; i < valitutTilat.length; i++){
                            var tila = valitutTilat[i];
                            
                            // Valintalistan valinta palauttaa suoraan id:t
                            if(angular.isNumber(tila)){
                            	tilat = tilat + tila + "" +',';
                            }else{
                            	// Sivu avattaessa valintalistan oletuksen on objekti, jonka id lähtee bäkkäriin
                                if('id' in tila){
                                	tilat = tilat + tila.id + ',';
                                } 
                            }
                        }
                        // viimeinen pilkku pois
                        tilat = tilat.slice(0,-1);
                        
                        if(tilat){
                        	filterParameters['loydon_tilat'] = tilat;
                        }
                    }
                    
                    vm.loydotPromise = LoytoService.haeLoydot(filterParameters);
                    vm.loydotPromise.then(function(data) {
                    	
                        if (data.count) {
                            vm.searchResults = data.count;
                        } else {
                            vm.searchResults = 0;
                        }                                        
                        
                        // no sorting, it is done in backend
                        params.total(data.total_count);
                        $defer.resolve(data.features);
                        
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        orderedData = [];
                        $defer.resolve(orderedData);
                    });
                }
            });
            
            // Ajoitusten valintalista
            vm.ajoitukset = [
        		{id : 1, nimi_fi : "Ajoitetut"},
        		{id : 2, nimi_fi : "Ajoittamattomat"},
        		{id : 3, nimi_fi : "Kaikki"}
    		];
            
            /*
             * Löytötaulukon suodatusten oletukset asetetaan yksikkö-sivun valinnan mukaan.
             */
            vm.hakuOletukset = function() {
                // Luodaan properties
                var filter = {
                        'properties' : {}
                    };
                
                // Ajoitusvalintalista
		        if(ajoitettu === 'ajoitettu'){
		        	filter['properties']['valittu_ajoitus'] = 1;
		        }else if(ajoitettu === 'ajoittamaton' ){
		        	filter['properties']['valittu_ajoitus'] = 2;
		        }else if(ajoitettu === 'poistettu'){
		        	filter['properties']['valittu_ajoitus'] = 3;
		        	filter['properties']['loydon_tilat'] = [{id: 5, nimi_fi: "Poistettu luettelosta"}]; // oletusarvo objektina listalle, jotta näkyy valintalistalla
		        }
		        
		        // Materiaalikoodi 
		        if(materiaalikoodi){
		        	filter['properties']['materiaalikoodit'] = materiaalikoodi;
		        }
                
		        // Lisätään taulukon filttereihin
                angular.extend(vm.loydotTable.filter(), filter);
            };

            vm.hakuOletukset();

			/*
			 * Avaa löytö katselutilaan
			 */ 
			vm.selectLoyto = function(valittu_loyto) {
				
            	LoytoService.haeLoyto(valittu_loyto.properties.id).then(function(loyto) {
            		EntityBrowserService.setQuery('loyto', loyto.properties.id, filterParameters, vm.loydotTable.data.length);
            		ModalService.loytoModal(loyto, false);
                    
				});
				
			};
			
			/*
			 * Päivitetään yksikön löytöjen taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {                        
                if (data.type == 'loyto') {
                    vm.loydotTable.reload();
                }
            });
			
			vm.curLocale = locale.getLocale();
			
		}
]);
