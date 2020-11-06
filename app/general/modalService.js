/*
 * Service for modals
 */
angular.module('mip.general').factory(
        'ModalService',
        [
                '$rootScope', '$modal', 'CONFIG', 'KuntaService', 'KiinteistoService', 'RakennusService','AlueService', 'ArvoalueService',
                'InventointiprojektiService', 'UserService', 'KylaService', 'PorrashuoneService', 'SuunnittelijaService', 'YksikkoService',
                'Auth', 'AlertService', 'locale', '$timeout', 'InventointijulkaisuService', 'MatkaraporttiService', 'ModalServiceExtension',
                'ModalServiceArkExtension', 'KohdeService',
                function($rootScope, $modal, CONFIG, KuntaService, KiinteistoService, RakennusService, AlueService, ArvoalueService,
                    InventointiprojektiService, UserService, KylaService, PorrashuoneService, SuunnittelijaService, YksikkoService,
                    Auth, AlertService, locale, $timeout, InventointijulkaisuService, MatkaraporttiService, ModalServiceExtension,
                    ModalServiceArkExtension, KohdeService) {

                    var nextModalId = 1;
                    var nextModalZIndex = 500;

                    var modalServiceFunctions = {

                        /*
                         * Open any type of modal
                         */
                        openModal : function(type, id) {
                            // NOTE: Be careful with the parameter order as it seems to vary between the methods...
                            switch (type) {
                                case 'KIINTEISTO':
                                    KiinteistoService.fetchKiinteisto(id).then(function success(data) {
                                        modalServiceFunctions.kiinteistoModal(data);
                                    });
                                    break;
                                case 'RAKENNUS':
                                    RakennusService.fetchRakennus(id).then(function success(data) {
                                        modalServiceFunctions.rakennusModal(true, data);
                                    });
                                    break;
                                /*case 'PROJEKTI':
                                    ProjektiService.fetchProjekti(id).then(function success(data) {
                                        modalServiceFunctions.projektiModal(true, data);
                                    });
                                    break;*/
                                case 'YKSIKKO':
                                    YksikkoService.fetchYksikko(id).then(function success(data) {
                                        var projId = data.properties.projekti.id;
                                        /*
                                        ProjektiService.fetchProjekti(projId).then(function success(projData) {
                                            modalServiceFunctions.yksikkoModal(projData, data, true);
                                        });
                                        */
                                    });
                                    break;
                                case 'ALUE':
                                    AlueService.fetchAlue(id).then(function success(data) {
                                        modalServiceFunctions.alueModal(true, data);
                                    });
                                    break;
                                case 'ARVOALUE':
                                    ArvoalueService.fetchArvoalue(id).then(function success(data) {
                                        AlueService.fetchAlue(data.properties.alue_id).then(function success(alueData) {
                                            modalServiceFunctions.alueModal(true, data, alueData);
                                        });
                                    });
                                    break;
                                case 'INVENTOINTIPROJEKTI':
                                    InventointiprojektiService.fetchInventointiprojekti(id).then(function success(data) {
                                        modalServiceFunctions.inventointiprojektiModal(true, data);
                                    });
                                    break;
                                case 'KAYTTAJA':
                                    UserService.getUser(id).then(function success(data) {
                                        modalServiceFunctions.userModal(data);
                                    });
                                    break;
                                case 'KUNTA':
                                    KuntaService.fetchKunta(id).then(function success(data) {
                                        modalServiceFunctions.kuntaModal(true, data);
                                    });
                                    break;
                                case 'KYLA':
                                    KylaService.fetchKyla(id).then(function success(data) {
                                        modalServiceFunctions.kylaModal(true, data);
                                    });
                                    break;
                                case 'PORRASHUONE':
                                    PorrashuoneService.fetchPorrashuone(id).then(function success(data) {
                                        modalServiceFunctions.porrashuoneModal(true, data, data.properties.rakennus_id);
                                    });
                                    break;
                                case 'SUUNNITTELIJA':
                                    SuunnittelijaService.fetchSuunnittelija(id).then(function success(data) {
                                        modalServiceFunctions.suunnittelijaModal(true, data);
                                    });
                                    break;
                                case 'ARK_KOHDE':
                                    KohdeService.fetchKohde(id).then(function success(data) {
                                        modalServiceFunctions.kohdeModal(data);
                                    });
                                default:
                                    // Show error to the user if no valid modaltype given
                                    locale.ready('common').then(function() {
                                        AlertService.showError(locale.getString('common.Error'));
                                    });
                            }
                        },
                        getNextModalId : function() {
                            return nextModalId++;
                        },
                        getNextModalZIndex : function() {
                            return nextModalZIndex++;
                        },
                        /*
                         * Sulkee valitun modaalin ja poistaa modaalien listalta
                         */
                        closeModal : function(modalNameId){
                            if($rootScope._modals.length > 0) {
                            	var modalIndex = $rootScope._modals.indexOf(modalNameId);
                			    for (var i=0; i < $rootScope._modals.length; i++) {
            			    		if($rootScope._modals[i].$id === modalNameId){
            			    			 $rootScope._modals[i].hide();
                                         $rootScope._modals.splice(i, 1);
                                         break;
            			    		}
            			      }

                            }
                        },
                        /*
                         * Sulkee kaikki modaalit
                         */
                        closeModals : function(){
                            if($rootScope._modals.length > 0) {
                                for (var i = $rootScope._modals.length-1; i >= 0; i--) {
                                    $rootScope._modals[i].hide();
                                    $rootScope._modals[i].destroy();
                                    $rootScope._modals.splice(i, 1);
                                }
                            }
                        },
                        /*
                         * Avaa kaikki piilotetut modaalit
                         */
                        showAllModals : function(){
                            if($rootScope._modals.length > 0) {
                			    for (var i=0; i < $rootScope._modals.length; i++) {
            			    		$rootScope._modals[i].$element.css('display','block');
            			      }
                            }

                        },
                        /*
                         * Piilottaa kaikki modaalit
                         */
                        hideAllModals : function(){
                            if($rootScope._modals.length > 0) {
                			    for (var i=0; i < $rootScope._modals.length; i++) {
            			    		$rootScope._modals[i].$element.css('display','none');
            			      }
                            }

                        },
                    }
                    // Yhdistää yleiset modaalit ja rakennusinventoinnin modaalit
                    var rakModalFunctions = angular.extend(modalServiceFunctions, ModalServiceExtension);

                    // Yhdistetään mukaan argeologian modaalit laajennus factorysta
                    return angular.extend(rakModalFunctions, ModalServiceArkExtension);

                }
        ]);