/*
 * Controller for Map main view. The markers are shown on map. Aside is used for filtering. Clicking on a marker opens up the modal and shows the details for the marker.
 */

angular.module('mip.map').controller('FeatureinfoController', [
        '$scope', 'TabService', 'KiinteistoService', 'RakennusService', 'AlueService',
        'ArvoalueService', 'ModalService', 'CONFIG', 'locale', 'data', 'selectedModalNameId',
        '$sce', 'host',
        function($scope, TabService, KiinteistoService, RakennusService, AlueService,
        		ArvoalueService, ModalService, CONFIG, locale, data, selectedModalNameId,
        		$sce, host) {

            // Unique modal id which is used for the collapsible panels
            $scope.modalId = ModalService.getNextModalId();
            // Valitun modalin nimi ja järjestysnumero
            $scope.modalNameId = selectedModalNameId;

            $scope.resizeIcon = "▢";
            $scope.host = host;
            
            data = data.data.slice(1).slice(0, -1);
            
            var rawHtml = jQuery.parseHTML(data);

            var srcTable;

            // Linkitys museoviraston kulttuuriympäristön palveluikkunan karttaan, tehdään jos hostina on nba
            if(host.indexOf('nba') > -1) {
	            angular.forEach(rawHtml, function(value, key) {
	                var keepSearching = true; //Foreachista ei pääse ulos näppärästi haluttaessa.
	                if(keepSearching) {
	                    if(value.localName === 'table') {
	                        srcTable = $(value);
	                        keepSearching = false;
	                    }
	                }
	            	//if(key === 7){
	            	//	srcTable = $(value);
	            	//}
	            });
            }


            if(data.indexOf('ServiceException') > -1) {
                $scope.data = '<span><b>Tietoja ei löytynyt</span>';
            } else if(srcTable !== undefined) { //Jos tuloksena tulee table
                // Taulun tyylit
                var fixedTable = '<table class="table table-striped table-bordered ng-table"><tr>';

                // Otsikoiden muodostus
                srcTable.find('th').each(function (i) {
                	fixedTable = fixedTable.concat('<th>' + $(this).text() + '</th>');
                });

                fixedTable = fixedTable.concat('</tr>');

                // 2. rivistä alkaen haetaan tiedot tauluun
                srcTable.find('tr').each(function (i, el) {

                	if(i > 0){
                		fixedTable = fixedTable.concat('<tr>');
                	}
                    $(this).find('td').each(function (ind){
                    	// Oletus että aina alkaa linkki näin
                    	if($(this).text().trim().startsWith('www')){
                    		// Tehdään linkki
                    		fixedTable = fixedTable.concat('<td>' + '<a target="_blank" href="http://' +$(this).text() +'">' + $(this).text() + '</a>' + '</td>');
                    	} else if($(this).text().trim().startsWith('http://www')) {
                    	 // Tehdään linkki
                            fixedTable = fixedTable.concat('<td>' + '<a target="_blank" href="' +$(this).text() +'">' + $(this).text() + '</a>' + '</td>');
                    	}else{
                    		fixedTable = fixedTable.concat('<td>' + $(this).text() + '</td>');
                    	}
                    });
                    fixedTable = fixedTable.concat('</tr>');
                });

                fixedTable = fixedTable.concat('</table>');

                // Html luotto päälle jotta linkit näytetään
                $scope.data = $sce.trustAsHtml(fixedTable);
            } else {
            	$scope.data = $sce.trustAsHtml(data);
            }

            $scope.selectKiinteisto = function(kiinteisto) {
                KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function(kiinteisto) {
                    ModalService.kiinteistoModal(kiinteisto, null);
                });
            };
            $scope.selectRakennus = function(rakennus) {
                RakennusService.fetchRakennus(rakennus.properties.id).then(function(rakennus) {
                    ModalService.rakennusModal(true, rakennus);
                });
            };
            $scope.selectAlue = function(alue) {
                AlueService.fetchAlue(alue.properties.id).then(function(alue) {
                    ModalService.alueModal(true, alue);
                });
            };
            $scope.selectArvoalue = function(arvoalue) {
                ArvoalueService.fetchArvoalue(arvoalue.properties.id).then(function(arvoalue) {
                    ModalService.arvoalueModal(true, arvoalue);
                });
            };

            /*
             * Maximize or restore the modal
             */
            $scope.resize = function() {
                $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);

                $timeout(function() {
                    $scope.map.updateSize();
                });
            };

            $scope.close = function() {
                if ($scope.edit) {
                    $scope.cancelEdit();
                }
                $scope.showMap = false;
            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal($scope.modalNameId);
                $scope.$destroy();
            };

        }

]);
