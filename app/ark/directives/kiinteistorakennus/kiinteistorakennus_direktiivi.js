angular.module('mip.directives').directive('mipKiinteistorakennus', [
        'locale', 'ListService', function(locale, ListService) {
            /**
             * Kiinteistojen ja rakennusten valitsin.
             */
            function link(scope, elem, attrs) {
                /*
                 * Lisää uusi kiinteisto/rakennus ja osoite
                 */
                scope.addKiinteistoRakennus = function() {
                	
                	var osoite = {
                			'katunimi': null,
                			'katunumero': null,
                			'postinumero': null,
                			'kuntanimi': null,
                			'kieli': null,
                			'rakennustunnus': null
                	};
                	
                    var kiinteistorakennus = {
                            'kiinteistotunnus': null,
                            'kiinteisto_nimi' : null,
                            'osoitteet' : []
                         };
                    
                    kiinteistorakennus.osoitteet.push(osoite);
                    scope.krModel.push(kiinteistorakennus);
                }
                
                scope.addOsoite = function(index) {
                	
                	var osoite = {
                			'katunimi': null,
                			'katunumero': null,
                			'postinumero': null,
                			'kuntanimi': null,
                			'kieli': null,
                			'rakennustunnus': null
                	};
                	
                	scope.krModel[index].osoitteet.push(osoite);
                }

                /*
                 * Poista kiinteisto/rakennus
                 */
                scope.deleteKiinteistoRakennus = function(index) {
                    scope.krModel.splice(index, 1);
                }
                
                /*
                 * Valittu osoite poistetaan 
                 */
                scope.deleteOsoite = function(osoite, kiinteistorakennus){
                	
                	// kiinteistön indeksi
                	var k_ind = scope.krModel.indexOf(kiinteistorakennus);
                	
                	// osoitteen indeksi
                	var o_ind = scope.krModel[k_ind].osoitteet.indexOf(osoite);
                	
                	// Poistetaan valittu osoite
                	scope.krModel[k_ind].osoitteet.splice(o_ind, 1);
                }
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	krModel : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/kiinteistorakennus/kiinteistorakennus.html'
            };
        }
]);