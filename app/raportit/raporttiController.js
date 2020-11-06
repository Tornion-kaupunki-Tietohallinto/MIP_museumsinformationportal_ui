/*
 * Controller for the report creation, NOT for report modification or downloading. 
 */
angular.module('mip.raportti').controller(
        'RaporttiController',
        [
                '$scope', 'TabService', '$location', 'RaporttiService', 'locale', 'ModalService', 'selectedModalNameId', 
                'AlertService', 'valittuKoriId', 'valittuKorityyppi',                                                           
                function($scope, TabService, $location, RaporttiService, locale, ModalService, selectedModalNameId, 
                		AlertService, valittuKoriId, valittuKorityyppi) {                    

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();
                    
                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                	
                	/*
                     * Init and scope variables
                     */
                    $scope.data = {
                        'raporttityypit' : [
                            {
                                'id': 'Kuntaraportti',
                                'name': locale.getString("common.County_list_report")
                            }, {
                                'id': 'Inventointiprojektiraportti',
                                'name': locale.getString("common.Inventory_project_report")
                            }, {
                                'id': 'Vuosiraportti',
                                'name': locale.getString("common.Annual_report")
                            }, {
                                'id': 'Yhteenvetoraportti',
                                'name': locale.getString("common.Summary_report")
                            },{
                                'id': 'Matkaraporttikooste',
                                'name': locale.getString("common.Travel_report_summary")
                            }
                        ],
                        raportti : {}
                    };
                    
                    // Koriraportti
                    if(valittuKoriId && valittuKorityyppi){
                    	$scope.valittuKoriId = valittuKoriId;
                    	$scope.valittuKorityyppi = valittuKorityyppi;
                    	$scope.data.raporttityypit = [{'id': 'Koriraportti', 'name': locale.getString("common.Cart_list_report")}];
                    	$scope.data.raporttityyppi = "Koriraportti";
                    	$scope.data.raportti.koriId = valittuKoriId;
                    }
                    
                    /*
                     * Clear selections and start from the beginning
                     */
                    $scope.clear = function() {
                        //Clear everything inside raportti
                        $scope.data.raportti = {};
                        delete $scope.data.raporttityyppi;
                    };
                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };
                    
                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    $scope.create = function() {
                        RaporttiService.createRaportti($scope.data.raporttityyppi, $scope.data.raportti).then(function success(data) {
                            locale.ready('common').then(function() {
                                AlertService.showInfo(locale.getString('common.Report_request_created'));
                            });
                            // Sulkee modaalin ja poistaa listalta
                            ModalService.closeModal($scope.modalNameId);
                            $scope.$destroy();
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };
                }
        ]);
