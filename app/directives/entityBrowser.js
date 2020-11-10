/*
 * Toiminnallisuus koostuu servicestä ja itse direktiivistä joka on dialogien alareunassa.
 * Serviceen tallennetaan jokaiselle listaussivulla käytetyt hakuparametrit, joiden avulla listauksessa tehdään tarvittaessa sama haku uudelleen.
 * Direktiivissä siirrytään seuraavaan / edelliseen entiteettiin ja tarvittaessa haetaan uusi lista entiteettejä.
 * Perustoiminnallisuus on simppelihkö, mutta sisältää paljon poikkeuksia:
 *  1. Listaussivun hakuehdot tallennetaan serviceen
 *  2. Kun entiteetti avataan, päivitetään listaussivun hakuun tieto avatun entiteetin IDstä ja tyypistä
 *  3. Direktiivissä haetaan samalla haulla listaussivun hakutulokset valmiiksi (cachea hyödynnetään)
 *      Serviceen voidaan myös tallentaa lista entiteettejä. Tämä on suositeltavaa jos niitä ei ole montaa kappaletta (esim kiinteistön inventointiprojektit, rakennuksen suunnittelijat jne)
 *  4. Kun käyttäjä siirtyy seuraavaan entiteettiin, siirrytään listassa seuraavaan entiteettiin
 *      Jos ollaan listan viimeisessä entiteetissä, mutta entiteettejä on saatavissa enemmän, ladataan seuraava lista samoilla hakuehdoilla, mutta rivitystä kasvattaen
 *      Jos enempää ei ole saatavilla, disabloidaan seuraava-nappula
 *  5. Kun käyttäjä siirtyy edelliseen entiteettiin, siirrytään listassa edelliseen entiteettiin
 *      Jos ollaan listan ensimmäisessä entiteetissä, mutta entiteettejä on saatavissa enemmän, ladataan seuraava lista samoilla hakuehdoilla, mutta rivitystä pienentäen
 *      Jos enempää ei ole saatavilla, disabloidaan edellinen-nappula
 *  6. Kun käyttäjä siirtyy seuraavaan / edelliseen, suljetaan nykyinen dialogi pienellä viiveellä
 *  7. Kun serviceen on kertynyt paljon hakuja, siivoillaan vanhimpia
 *
 *  Joissain tilanteissa
 */
angular.module('mip.directives').factory('EntityBrowserService', [function() {

    var queries = [];

    return {

        /*
         * Get the used query item for the defined entity
         */
        getQuery : function(type, entityId) {
            for(var i = 0; i<queries.length; i++) {
                if(entityId == undefined) {
                    if(queries[i].type === type) {
                        return queries[i];
                    }
                }
                if(queries[i].type === type && queries[i].entityId === entityId){
                    return queries[i];
                }
            }
            return null;
        },
        /*
         * Save the query for an entity
         * Parameters:
         *  type: The type of the entity (kiinteisto, rakennus, etc)
         *  entityId: The id of the entity, can be null (e.g. when we're in the listpage and we do searches.)
         *  query: The parameters that we're used to get the listing containing the entity.
         *  totalCount: The total count of items found.
         *  itemList: The list of items. In some cases we can't query for the same items sufficiently, so we provide the items here. Can be null.
         */
        setQuery : function(type, entityId, query, totalCount, itemList) {
            for(var i = 0; i<queries.length; i++) {
                if(queries[i].type == type && queries[i].entityId === entityId) {
                    queries.splice(i, 1);
                    break;
                }
            }
            queries.push({type: type, entityId: entityId, query: query, totalCount: totalCount, itemList: itemList});

            //Do a bit of clean up while we're at it...
            if(queries.length > 50) {
                //Remove the oldest item to keep the array smallish
                queries.splice(0, 1);
            }
        }
    }
}]).directive('mipEntiteettiselain', ['EntityBrowserService', '$q', 'ModalService', '$timeout', 'KiinteistoService',
	'RakennusService', 'PorrashuoneService', 'AlueService', 'ArvoalueService', 'KuntaService', 'KylaService',
	'SuunnittelijaService', 'InventointiprojektiService', 'InventointijulkaisuService', 'MatkaraporttiService',
	'UserService', '$filter', 'LoytoService', 'KoriService', 'NayteService', 'KohdeService', 'TutkimusService', 'YksikkoService',
  function(EntityBrowserService, $q, ModalService, $timeout, KiinteistoService,
		  RakennusService, PorrashuoneService, AlueService, ArvoalueService, KuntaService, KylaService,
		  SuunnittelijaService, InventointiprojektiService, InventointijulkaisuService, MatkaraporttiService,
		  UserService, $filter, LoytoService, KoriService, NayteService, KohdeService, TutkimusService, YksikkoService) {
    function link(scope, element, attrs) {

        //Store the original value of the entity id.
        //This is used to hide the template if it's undefined (= we're creating a new entity)
        scope.origEid = angular.copy(scope.eid);

        scope.query = EntityBrowserService.getQuery(scope.etype, scope.eid); //Local copy of the query used
        scope.entityIndex = ""; //By default we show "" to the user
        scope.list = []; //Local copy of the search results for loops etc.
        scope.buttonsDisabled = false;

        /*
         * Get a local copy of the entities (the previous search on the listpage) for looping etc.
         * Basically we execute the query again that was used to get the entity we opened. In some
         * special cases we do different search according to the parameters in the scope.query.query
         * or we provide empty list to disable navigation again according to the parameters
         * in the scope.query.query.
         */
        scope.getItems = function() {
            var deferred = $q.defer();
            //If the eid is undefined (= we're creating a new entity)
            //return an empty data.features[].
            if(scope.eid == undefined) {
                var data = {
                        'features': []
                    };

                deferred.resolve(data);
            } else {
                switch (scope.etype) {
                    case 'kiinteisto':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        }else if(scope.query.query['arvoalue_id'] != undefined) {
                            //Get the kiinteistot by the sijainti
                            ArvoalueService.getKiinteistotForArvoalue(scope.query.query['arvoalue_id']).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kunta_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kunta_id'];

                            KuntaService.getKiinteistotOfKunta(scope.query.query['kunta_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kyla_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kyla_id'];

                            KylaService.getKiinteistotOfKyla(scope.query.query['kyla_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['inventointiprojekti_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['inventointiprojekti_id'];

                            InventointiprojektiService.getKiinteistotOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if(scope.query.query['rakennus_id'] != undefined || scope.query.query['porrashuone_id'] != undefined) {
                            deferred.resolve({'features': []});
                        } else if(scope.query.query['mainmap'] == true) { //If we came from the big map use the provided itemlist instead of the query parameters.
                            deferred.resolve(scope.query.itemList);
                        } else {
                            KiinteistoService.getKiinteistot(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'rakennus':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        }else if(scope.query.query['porrashuone_id'] != undefined) {
                            deferred.resolve({'features': []});
                        } else if (scope.query.query['kunta_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kunta_id'];

                            KuntaService.getRakennuksetOfKunta(scope.query.query['kunta_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kyla_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kyla_id'];

                            KylaService.getRakennuksetOfKyla(scope.query.query['kyla_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['inventointiprojekti_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['inventointiprojekti_id'];

                            InventointiprojektiService.getRakennuksetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if(scope.query.query['suunnittelija_id'] != undefined) {
                           SuunnittelijaService.getRakennuksetOfSuunnittelija(scope.query.query['suunnittelija_id']).then(function(data) {
                               //Fix the data...
                               for(var i = 0; i<data.features.length; i++) {
                                   if(data.features[i]['properties']['rakennus_id'] != undefined) {
                                       data.features[i]['properties']['id'] = data.features[i]['properties']['rakennus_id'];
                                   }
                               }
                               deferred.resolve(data);
                           });
                        } else if(scope.query.query['mainmap'] == true) { //If we came from the big map use the provided itemlist instead of the query parameters.
                            deferred.resolve(scope.query.itemList);
                        } else {
                            RakennusService.getRakennukset(scope.query.query).then(function(data) {
                                //Order the results by inventointinumero in certain cases (= when we open one rakennus from kiinteisto page
                                if(scope.query.query['kiinteisto_id']) {
                                    var orderedList = $filter('orderBy')(data.features, 'properties.inventointinumero');
                                    data['features'] = orderedList;
                                }
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'porrashuone':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        }else if(scope.query.query['rakennus_id'] != undefined) {
                            RakennusService.getPorrashuoneetOfRakennus(scope.query.query['rakennus_id']).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else {
                            PorrashuoneService.getPorrashuoneet(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'alue':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        }else if(scope.query.query['arvoalue_id'] != undefined) {
                            deferred.resolve({'features': []});
                        } else if (scope.query.query['kunta_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kunta_id'];

                            KuntaService.getAlueetOfKunta(scope.query.query['kunta_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kyla_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kyla_id'];

                            KylaService.getAlueetOfKyla(scope.query.query['kyla_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['inventointiprojekti_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['inventointiprojekti_id'];

                            InventointiprojektiService.getAlueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if(scope.query.query['mainmap'] == true) { //If we came from the big map use the provided itemlist instead of the query parameters.
                            deferred.resolve(scope.query.itemList);
                        } else {
                            AlueService.getAlueet(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'arvoalue':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        }else if(scope.query.query['alue_id'] != undefined) {
                            AlueService.getArvoalueetOfAlue(scope.query.query['alue_id']).then(function (data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kunta_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kunta_id'];

                            KuntaService.getArvoalueetOfKunta(scope.query.query['kunta_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['kyla_id'] != undefined) {
                              var additionalParams = angular.copy(scope.query.query);
                              delete additionalParams['kyla_id'];

                              KylaService.getArvoalueetOfKyla(scope.query.query['kyla_id'], additionalParams).then(function(data) {
                                  deferred.resolve(data);
                              });
                        } else if (scope.query.query['inventointiprojekti_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['inventointiprojekti_id'];

                            InventointiprojektiService.getArvoalueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if(scope.query.query['mainmap'] == true) { //If we came from the big map use the provided itemlist instead of the query parameters.
                            deferred.resolve(scope.query.itemList);
                        } else {
                            ArvoalueService.getArvoalueet(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'kunta':
                        if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['rakennus_id'] != undefined
                                || scope.query.query['porrashuone_id'] != undefined || scope.query.query['alue_id'] != undefined
                                || scope.query.query['arvoalue_id'] != undefined || scope.query.query['kyla_id'] != undefined) {
                            //We only show one item because we do not have one-many relation
                            deferred.resolve({'features': []});
                        } else {
                            KuntaService.getKunnat(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'kyla':
                        if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['rakennus_id'] != undefined
                                || scope.query.query['porrashuone_id'] != undefined || scope.query.query['alue_id'] != undefined
                                || scope.query.query['arvoalue_id'] != undefined) {
                            //We only show one item because we do not have one-many relation
                            deferred.resolve({'features': []});
                        } else if (scope.query.query['kunta_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['kunta_id'];

                            KuntaService.getKylatOfKunta(scope.query.query['kunta_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if (scope.query.query['inventointiprojekti_id'] != undefined) {
                            var additionalParams = angular.copy(scope.query.query);
                            delete additionalParams['inventointiprojekti_id'];

                            InventointiprojektiService.getKylatOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], additionalParams).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else {
                            KylaService.getKylat(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'suunnittelija':
                        if(scope.query.query['rakennus_id'] != undefined) {
                            var fixedList = [];
                          //"Fix" the data; add "properties" to each entity in the list
                            for(var i = 0; i<scope.query.itemList.length; i++) {
                                var fixedItem = {'properties': scope.query.itemList[i]};
                                if(fixedItem['properties']['suunnittelija_id'] != undefined) {
                                    fixedItem['properties']['id'] = fixedItem['properties']['suunnittelija_id'];
                                }
                                fixedList.push(fixedItem);
                            }
                            //"Fix" the data; add "features" to the collection.
                            var data = {'features': fixedList};
                            deferred.resolve(data);
                        } else {
                            SuunnittelijaService.getSuunnittelijat(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'inventointiprojekti':
                        //If we came from the kiinteistoController, we have list of items (=the inventoryprojects that the kiinteisto was related to)
                        if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['alue_id'] != undefined || scope.query.query['arvoalue_id'] != undefined) {
                            var fixedList = [];
                            //"Fix" the data; add "properties" to each entity in the list
                            for(var i = 0; i<scope.query.itemList.length; i++) {
                                var fixedItem = {'properties': scope.query.itemList[i]};
                                fixedList.push(fixedItem);
                            }
                            //"Fix" the data; add "features" to the collection.
                            var data = {'features': fixedList};
                            deferred.resolve(data);
                        } else {
                            InventointiprojektiService.getInventointiprojektit(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'inventointijulkaisu':
                        InventointijulkaisuService.getInventointijulkaisut(scope.query.query).then(function(data) {
                            deferred.resolve(data);
                        });
                        break;
                    case 'matkaraportti':
                        MatkaraporttiService.getMatkaraportit(scope.query.query).then(function(data) {
                            deferred.resolve(data);
                        });
                        break;
                    case 'kayttaja':
                        if(scope.query.query['userSettings'] == true) {
                            deferred.resolve({features: []});
                        } else {
                            UserService.getUsers(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }
                        break;
                    case 'loyto':
                         if(scope.query.query['kori_id_lista'] !== undefined) {
                        	 KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                 deferred.resolve(data);
                             });
                         } else if(scope.query.query['tapahtuma'] !== undefined) {
                        	 LoytoService.haeKoriTapahtumat(scope.query.query['tapahtuma'].tapahtuma_tyyppi.id, scope.query.query['tapahtuma'].luotu).then(function(data) {
                        		 deferred.resolve(data);
                        	 });
                         } else if(scope.query.query['ark_kartta_id'] !== undefined || scope.query.query['ark_kuva_id'] !== undefined) {
                        	 var fixedList = [];
                             //"Fix" the data; add "properties" to each entity in the list
                             for(var i = 0; i<scope.query.itemList.length; i++) {
                                 var fixedItem = {'properties': scope.query.itemList[i]};
                                 fixedList.push(fixedItem);
                             }
                             //"Fix" the data; add "features" to the collection.
                             var data = {'features': fixedList};
                             deferred.resolve(data);
                         } else {
                            LoytoService.haeLoydot(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                         }
                        break;
                    case 'nayte':
                        if(scope.query.query['kori_id_lista'] !== undefined) {
                       	 	KoriService.haeKorinTiedot(scope.query.query.kori.korityyppi, {'kori_id_lista': scope.query.query['kori_id_lista']}).then(function(data) {
                                deferred.resolve(data);
                            });
                        } else if(scope.query.query['tapahtuma'] !== undefined) {
                       	 	NayteService.haeKoriTapahtumat(scope.query.query['tapahtuma'].tapahtuma_tyyppi.id, scope.query.query['tapahtuma'].luotu).then(function(data) {
                       	 		deferred.resolve(data);
                       	 	});
                        } else if(scope.query.query['ark_kartta_id'] !== undefined || scope.query.query['ark_kuva_id'] !== undefined) {
                        	var fixedList = [];
	                        //"Fix" the data; add "properties" to each entity in the list
	                        for(var i = 0; i<scope.query.itemList.length; i++) {
	                            var fixedItem = {'properties': scope.query.itemList[i]};
	                            fixedList.push(fixedItem);
	                        }
	                        //"Fix" the data; add "features" to the collection.
	                        var data = {'features': fixedList};
	                        deferred.resolve(data);
                        } else {
                           NayteService.haeNaytteet(scope.query.query).then(function(data) {
                               deferred.resolve(data);
                           });
                        }
                       break;
                    case 'kohde':
                    	if(scope.query.query['kohde_id'] != undefined) {
                    		// Tätä käytetään kun ei haluta aktivoida entity-selaimen nuolia
                    		var fixedList = [];
                            var data = {'features': fixedList};
                            deferred.resolve(data);
                        } else if(scope.query.query['mainmap'] == true) { //If we came from the big map use the provided itemlist instead of the query parameters.
                            deferred.resolve(scope.query.itemList);
                         } else{
                            KohdeService.getKohteet(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }

                       break;
                    case 'tutkimus':
                    	if(scope.query.query['tutkimus_lista'] != undefined) {
                    		// Tutkimuslista välitetään tänne. Esim. kohteen tutkimuksen valinta listalta.
                        	var fixedList = [];
	                        //"Fix" the data; add "properties" to each entity in the list
	                        for(var i = 0; i < scope.query.query['tutkimus_lista'].length; i++) {
	                            var fixedItem = {'properties': scope.query.query['tutkimus_lista'][i]};
	                            fixedList.push(fixedItem);
	                        }
	                        //"Fix" the data; add "features" to the collection.
	                        var data = {'features': fixedList};
	                        deferred.resolve(data);
                    	}else if(scope.query.query['tutkimus_id'] != undefined) {
                    		// Tätä käytetään kun ei haluta aktivoida entity-selaimen nuolia
                    		// Kutsutyyli: EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, {'tutkimus_id': tutkimus.properties.id}, 1);
                    		var fixedList = [];
                            var data = {'features': fixedList};
                            deferred.resolve(data);
                        }
                    	else{
                            TutkimusService.haeTutkimukset(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                    	}
                    break;
                    case 'yksikko':
                        if(scope.query.query['yksikko_id'] != undefined) {
                            // Tätä käytetään kun ei haluta aktivoida entity-selaimen nuolia
                            var fixedList = [];
                            var data = {'features': fixedList};
                            deferred.resolve(data);
                        }else{
                            YksikkoService.haeYksikot(scope.query.query).then(function(data) {
                                deferred.resolve(data);
                            });
                        }

                   break;
                }
            }
            return deferred.promise;
        }

        /*
         * When the data has been received, fill the list and count the index of the entity.
         */
        scope.getItems().then(function (data) {
           scope.list = data.features;
       	   scope.entityIndex = scope.currentEntityIndex();
        });

        /*
         * Count the index of the entity. We return user friendly index starting from 1 instead of 0.
         * We trust that the current entity is in the list.
         */
        scope.currentEntityIndex = function() {
            //If we have an empty array of data, return 1 so that browsing cannot be executed
            if(scope.list.length == 0) {
                return 1;
            }
            for(var i = 0; i<scope.list.length; i++) {
                if(scope.eid == scope.list[i].properties.id) {
                    var beforeResults = scope.query.query.rivi; //Add items according to the pagination to the index.
                    if(beforeResults != undefined) {
                        return beforeResults + i + 1; //We get result e.g. 50 + 2 + 1 (add one so that the first item is 1, not 0.
                    } else {
                        return i+1; //We do not have e.g. rivi: 50 in the search params so just use the index + 1
                    }
                }
            }
        };

        scope.disableButtons = function(disable) {
            if(disable == true) {
                scope.buttonsDisabled = true;
            } else {
                scope.buttonsDisabled = false;
            }
        };

        /*
         * Select the next or previous entity.
         * If the entity is the first on the current list (scope.list) and we click previous, we need to create a new query, perform the search and then select the
         * last item of that list to be opened.
         * Similarly if the entity is the last item on the current list and we click next, we create a new query that gets the next items and then open the first item of
         * that list.
         * At last we close the obsolete modal so they will not get stacked.
         */
        scope.changeEntity = function(next) {
            scope.disableButtons(true);
            if(next == true) {
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.eid == scope.list[i].properties.id) {
                        //need to download a new list??
                        if(i == scope.list.length-1) {
                            /*
                             * Get a local copy of the entities for looping etc.
                             */
                            var q = angular.copy(scope.query);
                            q.query.rivi = q.query.rivi + q.query.rivit;
                            switch (scope.etype) {
                                case 'kiinteisto':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getKiinteistotOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[0].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getKiinteistotOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[0].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getKiinteistotOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[0].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        KiinteistoService.fetchKiinteisto(scope.list[scope.entityIndex].properties.id).then(function(kiinteisto) {
                                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                        });
                                    } else {
                                        KiinteistoService.getKiinteistot(q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[0].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    }
                                    break;
                                case 'rakennus':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getRakennuksetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[0].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else  if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getRakennuksetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[0].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else  if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getRakennuksetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[0].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        RakennusService.fetchRakennus(scope.list[scope.entityIndex].properties.id).then(function(rakennus) {
                                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.rakennusModal(true, rakennus);
                                        });
                                    } else {
                                        RakennusService.getRakennukset(q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[0].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, q.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    }
                                    break;
                                case 'porrashuone':
                                    PorrashuoneService.getPorrashuoneet(q.query).then(function(data) {
                                        PorrashuoneService.fetchPorrashuone(data.features[0].properties.id).then(function(ph) {
                                            EntityBrowserService.setQuery('porrashuone', ph.properties.id, q.query, scope.query.totalCount);
                                            ModalService.porrashuoneModal(true, ph);
                                        });
                                    });
                                    break;
                                case 'alue':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getAlueetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[0].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getAlueetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[0].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getAlueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[0].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        AlueService.fetchAlue(scope.list[scope.entityIndex].properties.id).then(function(alue) {
                                            EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.alueModal(true, alue);
                                        });
                                    } else {
                                        AlueService.getAlueet(q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[0].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, q.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    }
                                    break;
                                case 'arvoalue':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getArvoalueetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[0].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getArvoalueetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[0].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getArvoalueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[0].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        ArvoalueService.fetchArvoalue(scope.list[scope.entityIndex].properties.id).then(function(arvoalue) {
                                            EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.arvoalueModal(true, arvoalue);
                                        });
                                    } else {
                                        ArvoalueService.getArvoalueet(q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[0].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, q.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    }
                                    break;
                                case 'kunta':
                                    KuntaService.getKunnat(q.query).then(function(data) {
                                        KuntaService.fetchKunta(data.features[0].properties.id).then(function(kunta) {
                                            EntityBrowserService.setQuery('kunta', kunta.properties.id, q.query, scope.query.totalCount);
                                            ModalService.kuntaModal(true, kunta);
                                        });
                                    });
                                    break;
                                case 'kyla':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getKylatOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[0].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getKylatOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[0].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        });
                                    } else {
                                        KylaService.getKylat(q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[0].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        });
                                    }
                                    break;
                                case 'suunnittelija':
                                    if(scope.query.query['rakennus_id'] != undefined) {
                                        SuunnittelijaService.fetchSuunnittelija(data.features[0].properties.id).then(function(suunnittelija) {
                                            EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, q.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.suunnittelijaModal(true, suunnittelija);
                                        });
                                    } else {
                                        SuunnittelijaService.getSuunnittelijat(q.query).then(function(data) {
                                            SuunnittelijaService.fetchSuunnittelija(data.features[0].properties.id).then(function(suunnittelija) {
                                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, q.query, scope.query.totalCount);
                                                ModalService.suunnittelijaModal(true, suunnittelija);
                                            });
                                        });
                                    }
                                    break;
                                case 'inventointiprojekti':
                                    if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['alue_id'] != undefined
                                            || scope.query.query['arvoalue_id'] != undefined) {
                                        InventointiprojektiService.fetchInventointiprojekti(scope.list[scope.entityIndex].properties.id).then(function(ip) {
                                            EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.inventointiprojektiModal(true, ip);
                                        });
                                    } else {
                                        InventointiprojektiService.getInventointiprojektit(q.query).then(function(data) {
                                            InventointiprojektiService.fetchInventointiprojekti(data.features[0].properties.id).then(function(ip) {
                                                EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, q.query, scope.query.totalCount);
                                                ModalService.inventointiprojektiModal(true, ip);
                                            });
                                        });
                                    }
                                    break;
                                case 'inventointijulkaisu':
                                    InventointijulkaisuService.getInventointijulkaisut(q.query).then(function(data) {
                                        InventointijulkaisuService.fetchInventointijulkaisu(data.features[0].properties.id).then(function(ij) {
                                            EntityBrowserService.setQuery('inventointijulkaisu', ij.properties.id, q.query, scope.query.totalCount);
                                            ModalService.inventointijulkaisuModal(ij, true);
                                        });
                                    });
                                    break;
                                case 'matkaraportti':
                                    MatkaraporttiService.getMatkaraportit(q.query).then(function(data) {
                                        MatkaraporttiService.fetchMatkaraportti(data.features[0].properties.id).then(function(ij) {
                                            EntityBrowserService.setQuery('matkaraportti', ij.properties.id, q.query, scope.query.totalCount);
                                            ModalService.matkaraporttiModal(ij, true);
                                        });
                                    });
                                    break;
                                case 'kayttaja':
                                    UserService.getUsers(q.query).then(function(data) {
                                        UserService.getUser(data.features[0].properties.id).then(function(user) {
                                            EntityBrowserService.setQuery('kayttaja', user.id, q.query, scope.query.totalCount);
                                            ModalService.userModal(user);
                                        });
                                    });
                                    break;
                                case 'loyto':
                                    if(scope.query.query['kori_id_lista'] != undefined) {
                                    	for(var i = 0; i<scope.query.query['kori_id_lista'].length; i++) {
                                    		var ind = -1;
                                    		if(scope.eid == scope.query.query['kori_id_lista'][i]) {
                                    			ind = i;
                                    		}
                                    	}
                                    	LoytoService.haeLoyto(scope.query.query['kori_id_lista'][ind]).then(function (loyto) {
                                    		EntityBrowserService.setQuery('loyto', loyto.properties.id, q.query, scope.query.query['kori_id_lista'].length);
                                    		ModalService.loytoModal(loyto, false);
                                    	})
                                    	//TODO: tilanteet joissa ladataan uusi lista
                                    } else {
                                        LoytoService.haeLoydot(q.query).then(function(data) {
                                            LoytoService.haeLoyto(data.features[0].properties.id).then(function(loyto) {
                                                EntityBrowserService.setQuery('loyto', loyto.properties.id, q.query, scope.query.totalCount);
                                                ModalService.loytoModal(loyto, false);
                                            });
                                        });
                                    }
                                    break;
                                case 'nayte':
                                    if(scope.query.query['kori_id_lista'] != undefined) {
                                    	for(var i = 0; i<scope.query.query['kori_id_lista'].length; i++) {
                                    		var ind = -1;
                                    		if(scope.eid == scope.query.query['kori_id_lista'][i]) {
                                    			ind = i;
                                    		}
                                    	}
                                    	NayteService.haeNayte(scope.query.query['kori_id_lista'][ind]).then(function (nayte) {
                                    		EntityBrowserService.setQuery('nayte', nayte.properties.id, q.query, scope.query.query['kori_id_lista'].length);
                                    		ModalService.nayteModal(nayte, false);
                                    	})
                                    	//TODO: tilanteet joissa ladataan uusi lista
                                    } else {
                                        NayteService.haeNaytteet(q.query).then(function(data) {
                                            NayteService.haeNayte(data.features[0].properties.id).then(function(nayte) {
                                                EntityBrowserService.setQuery('nayte', nayte.properties.id, q.query, scope.query.totalCount);
                                                ModalService.nayteModal(nayte, false);
                                            });
                                        });
                                    }
                                    break;
                                case 'kohde':
                                    if(scope.query.query['mainmap'] == true) {
                                        KohdeService.fetchKohde(scope.list[scope.entityIndex].properties.id).then(function(kohde) {
                                            EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.kohdeModal(kohde);
                                        });
                                    } else {
                                        KohdeService.getKohteet(q.query).then(function(data) {
                                            KohdeService.fetchKohde(data.features[0].properties.id).then(function(kohde) {
                                                EntityBrowserService.setQuery('kohde', kohde.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kohdeModal(kohde);
                                            });
                                        });
                                    }
                                    break;
                                case 'tutkimus':
                                	if(scope.query.query['tutkimus_lista'] != undefined) {
                                    	for(var i = 0; i<scope.query.query['tutkimus_lista'].length; i++) {
                                    		var ind = -1;
                                    		if(scope.eid == scope.query.query['tutkimus_lista'][i]) {
                                    			ind = i;
                                    			break;
                                    		}
                                    	}
                                    	TutkimusService.haeTutkimus(scope.query.itemList[ind]).then(function (tutkimus) {
                                    		EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, q.query, scope.query.itemList.length);
                                    		ModalService.tutkimusModal(true, tutkimus, null);
                                    	})
                                	}else{
                                    	TutkimusService.haeTutkimukset(q.query).then(function(data) {
                                    		TutkimusService.haeTutkimus(data.features[0].properties.id).then(function(tutkimus) {
                                                EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, q.query, scope.query.totalCount);
                                                ModalService.tutkimusModal(true, tutkimus, null);
                                            });
                                        });
                                	}
                                break;
                                case 'yksikko':
                                        YksikkoService.haeYksikot(q.query).then(function(data) {
                                            YksikkoService.haeYksikko(data.features[0].properties.id).then(function(yksikko) {
                                                EntityBrowserService.setQuery('yksikko', yksikko.properties.id, q.query, scope.query.totalCount);
                                                ModalService.yksikkoModal(yksikko);
                                            });
                                        });
                                    break;
                            }
                        } else { // END NEED TO DOWNLOAD A NEW LIST.
                            if(i+1 != scope.query.totalCount) {
                                switch (scope.etype) {
                                    case 'kiinteisto':
                                        if(scope.query.query['mainmap'] == true) {
                                            KiinteistoService.fetchKiinteisto(scope.list[scope.entityIndex].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        } else {
                                            KiinteistoService.fetchKiinteisto(scope.list[i+1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        }
                                        break;
                                    case 'rakennus':
                                        if(scope.query.query['mainmap'] == true) {
                                            RakennusService.fetchRakennus(scope.list[scope.entityIndex].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.rakennusModal(true, rakennus);
                                            });
                                        } else {
                                            RakennusService.fetchRakennus(scope.list[i+1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        }
                                        break;
                                    case 'porrashuone':
                                        PorrashuoneService.fetchPorrashuone(scope.list[i+1].properties.id).then(function(ph) {
                                                EntityBrowserService.setQuery('porrashuone', ph.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.porrashuoneModal(true, ph);
                                            });
                                        break;
                                    case 'alue':
                                        if(scope.query.query['mainmap'] == true) {
                                            AlueService.fetchAlue(scope.list[scope.entityIndex].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.alueModal(true, alue);
                                            });
                                        } else {
                                            AlueService.fetchAlue(scope.list[i+1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        }
                                        break;
                                    case 'arvoalue':
                                        if(scope.query.query['mainmap'] == true) {
                                            ArvoalueService.fetchArvoalue(scope.list[scope.entityIndex].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        } else {
                                            ArvoalueService.fetchArvoalue(scope.list[i+1].properties.id).then(function(arvoalue) {
                                                    EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                    ModalService.arvoalueModal(true, arvoalue);
                                                });
                                        }
                                        break;
                                    case 'kunta':
                                        KuntaService.fetchKunta(scope.list[i+1].properties.id).then(function(kunta) {
                                                EntityBrowserService.setQuery('kunta', kunta.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kuntaModal(true, kunta);
                                            });
                                        break;
                                    case 'kyla':
                                        KylaService.fetchKyla(scope.list[i+1].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        break;
                                    case 'suunnittelija':
                                        if(scope.query.query['rakennus_id'] != undefined) {
                                            SuunnittelijaService.fetchSuunnittelija(scope.list[i+1].properties.id).then(function(suunnittelija) {
                                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.suunnittelijaModal(true, suunnittelija);
                                            });
                                        } else {
                                            SuunnittelijaService.fetchSuunnittelija(scope.list[i+1].properties.id).then(function(suunnittelija) {
                                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.suunnittelijaModal(true, suunnittelija);
                                            });
                                        }
                                        break;
                                    case 'inventointiprojekti':
                                        if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['alue_id'] != undefined
                                                || scope.query.query['arvoalue_id'] != undefined) {
                                            InventointiprojektiService.fetchInventointiprojekti(scope.list[scope.entityIndex].properties.id).then(function(ip) {
                                                EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.inventointiprojektiModal(true, ip);
                                            });
                                        } else {
                                            InventointiprojektiService.fetchInventointiprojekti(scope.list[i+1].properties.id).then(function(ip) {
                                                    EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount);
                                                    ModalService.inventointiprojektiModal(true, ip);
                                                });
                                        }
                                        break;
                                    case 'inventointijulkaisu':
                                        InventointijulkaisuService.fetchInventointijulkaisu(scope.list[i+1].properties.id).then(function(ij) {
                                                EntityBrowserService.setQuery('inventointijulkaisu', ij.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.inventointijulkaisuModal(ij, true);
                                            });
                                        break;
                                    case 'matkaraportti':
                                        MatkaraporttiService.fetchMatkaraportti(scope.list[i+1].properties.id).then(function(ij) {
                                                EntityBrowserService.setQuery('matkaraportti', ij.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.matkaraporttiModal(ij, true);
                                            });
                                        break;
                                    case 'kayttaja':
                                        UserService.getUser(scope.list[i+1].properties.id).then(function(user) {
                                                EntityBrowserService.setQuery('kayttaja', user.id, scope.query.query, scope.query.totalCount);
                                                ModalService.userModal(user);
                                            });
                                        break;
                                    case 'loyto':
                                    	if(scope.query.query['ark_kartta_id'] != undefined || scope.query.query['ark_kuva_id'] !== undefined) {
                                            LoytoService.haeLoyto(scope.list[scope.entityIndex].properties.id).then(function(l) {
                                                EntityBrowserService.setQuery('loyto', l.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.loytoModal(l, false);
                                            });
                                        } else {
	                                        LoytoService.haeLoyto(scope.list[i+1].properties.id).then(function(loyto) {
	                                            EntityBrowserService.setQuery('loyto', loyto.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.loytoModal(loyto, false);
	                                        });
                                        }
                                        break;
                                    case 'nayte':
                                    	if(scope.query.query['ark_kartta_id'] != undefined || scope.query.query['ark_kuva_id'] !== undefined) {
	                                        NayteService.haeNayte(scope.list[scope.entityIndex].properties.id).then(function(n) {
	                                            EntityBrowserService.setQuery('nayte', n.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
	                                            ModalService.nayteModal(n, false);
	                                        });
                                    	} else {
	                                        NayteService.haeNayte(scope.list[i+1].properties.id).then(function(nayte) {
	                                            EntityBrowserService.setQuery('nayte', nayte.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.nayteModal(nayte, false);
	                                        });
                                    	}
                                        break;
                                    case 'kohde':
                                        if(scope.query.query['mainmap'] == true) {
                                            KohdeService.fetchKohde(scope.list[scope.entityIndex].properties.id).then(function(kohde) {
                                                EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.kohdeModal(kohde);
                                            });
                                        } else {
                                            KohdeService.fetchKohde(scope.list[i+1].properties.id).then(function(kohde) {
                                                EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kohdeModal(kohde);
                                            });
                                        }
                                        break;
                                    case 'tutkimus':
                                    	TutkimusService.haeTutkimus(scope.list[i+1].properties.id).then(function(tutkimus) {
                                                EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.tutkimusModal(true, tutkimus, null);
                                            });
                                        break;
                                    case 'yksikko':
                                        YksikkoService.haeYksikko(scope.list[i+1].properties.id).then(function(yksikko) {
                                                EntityBrowserService.setQuery('yksikko', yksikko.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.yksikkoModal(yksikko);
                                            });
                                        break;
                                }
                            }
                        }
                        break;
                    } // END IF SCOPE.EID == LIST[I].PROPERTIES.ID
                } // END FOR LOOPING THE LIST
            } else { // END IF NEXT
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.eid == scope.list[i].properties.id) {
                        //need to download a new list??
                        if(i == 0) {
                            var q = angular.copy(scope.query);
                            q.query.rivi = q.query.rivi - q.query.rivit;
                            switch (scope.etype) {
                                case 'kiinteisto':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getKiinteistotOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[data.features.length-1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getKiinteistotOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[data.features.length-1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getKiinteistotOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[data.features.length-1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        KiinteistoService.fetchKiinteisto(scope.list[scope.entityIndex-2].properties.id).then(function(kiinteisto) {
                                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.kiinteistoModal(kiinteisto, null);
                                        });
                                    } else {
                                        KiinteistoService.getKiinteistot(q.query).then(function(data) {
                                            KiinteistoService.fetchKiinteisto(data.features[data.features.length-1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        });
                                    }
                                    break;
                                case 'rakennus':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getRakennuksetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[data.features.length-1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getRakennuksetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[data.features.length-1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getRakennuksetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[data.features.length-1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        RakennusService.fetchRakennus(scope.list[scope.entityIndex-2].properties.id).then(function(rakennus) {
                                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.rakennusModal(true, rakennus);
                                        });
                                    }  else {
                                        RakennusService.getRakennukset(q.query).then(function(data) {
                                            RakennusService.fetchRakennus(data.features[data.features.length-1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, q.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        });
                                    }
                                    break;
                                case 'porrashuone':
                                    PorrashuoneService.getPorrashuoneet(q.query).then(function(data) {
                                        PorrashuoneService.fetchPorrashuone(data.features[data.features.length-1].properties.id).then(function(ph) {
                                            EntityBrowserService.setQuery('porrashuone', ph.properties.id, q.query, scope.query.totalCount);
                                            ModalService.porrashuoneModal(true, ph);
                                        });
                                    });
                                    break;
                                case 'alue':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getAlueetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[data.features.length-1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getAlueetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[data.features.length-1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getAlueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[data.features.length-1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        AlueService.fetchAlue(scope.list[scope.entityIndex-2].properties.id).then(function(alue) {
                                            EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.alueModal(true, alue);
                                        });
                                    }  else {
                                        AlueService.getAlueet(q.query).then(function(data) {
                                            AlueService.fetchAlue(data.features[data.features.length-1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, q.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        });
                                    }
                                    break;
                                case 'arvoalue':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getArvoalueetOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[data.features.length-1].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['kyla_id'] != undefined) {
                                        delete q.query['kyla_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KylaService.getArvoalueetOfKyla(scope.query.query['kyla_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[data.features.length-1].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getArvoalueetOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[data.features.length-1].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    } else if(scope.query.query['mainmap'] == true) {
                                        ArvoalueService.fetchArvoalue(scope.list[scope.entityIndex-2].properties.id).then(function(arvoalue) {
                                            EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.arvoalueModal(true, arvoalue);
                                        });
                                    } else {
                                        ArvoalueService.getArvoalueet(q.query).then(function(data) {
                                            ArvoalueService.fetchArvoalue(data.features[data.features.length-1].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, q.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        });
                                    }
                                    break;
                                case 'kunta':
                                    KuntaService.getKunnat(q.query).then(function(data) {
                                        KuntaService.fetchKunta(data.features[data.features.length-1].properties.id).then(function(kunta) {
                                            EntityBrowserService.setQuery('kunta', kunta.properties.id, q.query, scope.query.totalCount);
                                            ModalService.kuntaModal(true, kunta);
                                        });
                                    });
                                    break;
                                case 'kyla':
                                    if(scope.query.query['kunta_id'] != undefined) {
                                        delete q.query['kunta_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        KuntaService.getKylatOfKunta(scope.query.query['kunta_id'], q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[data.features.length-1].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true,kyla);
                                            });
                                        });
                                    } else if(scope.query.query['inventointiprojekti_id'] != undefined) {
                                        delete q.query['inventointiprojekti_id'];
                                        scope.query.query['rivi'] = q.query.rivi;
                                        scope.query.query['rivit'] = q.query.rivit;

                                        InventointiprojektiService.getKylatOfInventointiprojekti(scope.query.query['inventointiprojekti_id'], q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[data.features.length-1].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true,kyla);
                                            });
                                        });
                                    } else {
                                        KylaService.getKylat(q.query).then(function(data) {
                                            KylaService.fetchKyla(data.features[data.features.length-1].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        });
                                    }
                                    break;
                                case 'suunnittelija':
                                    if(scope.query.query['rakennus_id'] != undefined) {
                                        SuunnittelijaService.fetchSuunnittelija(data.features[data.features.length-1].properties.id).then(function(suunnittelija) {
                                            EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, q.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.suunnittelijaModal(true, suunnittelija);
                                        });
                                    } else {
                                        SuunnittelijaService.getSuunnittelijat(q.query).then(function(data) {
                                            SuunnittelijaService.fetchSuunnittelija(data.features[data.features.length-1].properties.id).then(function(suunnittelija) {
                                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, q.query, scope.query.totalCount);
                                                ModalService.suunnittelijaModal(true, suunnittelija);
                                            });
                                        });
                                    }
                                    break;
                                case 'inventointiprojekti':
                                    if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['alue_id'] != undefined
                                            || scope.query.query['arvoalue_id'] != undefined) {
                                        InventointiprojektiService.fetchInventointiprojekti(scope.list[scope.entityIndex-2].properties.id).then(function(ip) {
                                            EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                            ModalService.inventointiprojektiModal(true, ip);
                                        });
                                    } else {
                                        InventointiprojektiService.getInventointiprojektit(q.query).then(function(data) {
                                            InventointiprojektiService.fetchInventointiprojekti(data.features[data.features.length-1].properties.id).then(function(ip) {
                                                EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, q.query, scope.query.totalCount);
                                                ModalService.inventointiprojektiModal(true, ip);
                                            });
                                        });
                                    }
                                    break;
                                case 'inventointijulkaisu':
                                    InventointijulkaisuService.getInventointijulkaisut(q.query).then(function(data) {
                                        InventointijulkaisuService.fetchInventointijulkaisu(data.features[data.features.length-1].properties.id).then(function(ij) {
                                            EntityBrowserService.setQuery('inventointijulkaisu', ij.properties.id, q.query, scope.query.totalCount);
                                            ModalService.inventointijulkaisuModal(ij, true);
                                        });
                                    });
                                    break;
                                case 'matkaraportti':
                                    MatkaraporttiService.getMatkaraportit(q.query).then(function(data) {
                                        MatkaraporttiService.fetchMatkaraportti(data.features[data.features.length-1].properties.id).then(function(ij) {
                                            EntityBrowserService.setQuery('matkaraportti', ij.properties.id, q.query, scope.query.totalCount);
                                            ModalService.matkaraporttiModal(ij, true);
                                        });
                                    });
                                    break;
                                case 'kayttaja':
                                    UserService.getUsers(q.query).then(function(data) {
                                        UserService.getUser(data.features[data.features.length-1].properties.id).then(function(user) {
                                            EntityBrowserService.setQuery('kayttaja', user.id, q.query, scope.query.totalCount);
                                            ModalService.userModal(user);
                                        });
                                    });
                                    break;
                                case 'loyto':
                                	//TODO: erikoistilanteet jossa ei selvitä pelkällä löydön haulla
                                    LoytoService.haeLoydot(q.query).then(function(data) {
                                        LoytoService.haeLoyto(data.features[data.features.length-1].properties.id).then(function(loyto) {
                                            EntityBrowserService.setQuery('loyto', loyto.properties.id, q.query, scope.query.totalCount);
                                            ModalService.loytoModal(loyto, false);
                                        });
                                    });
                                    break;
                                case 'nayte':
                                	//TODO: erikoistilanteet jossa ei selvitä pelkällä löydön haulla
                                    NayteService.haeNaytteet(q.query).then(function(data) {
                                        NayteService.haeNayte(data.features[data.features.length-1].properties.id).then(function(nayte) {
                                            EntityBrowserService.setQuery('nayte', nayte.properties.id, q.query, scope.query.totalCount);
                                            ModalService.nayteModal(nayte, false);
                                        });
                                    });
                                    break;
                                case 'kohde':
                                    if(scope.query.query['mainmap'] == true) {
                                        KohdeService.fetchKohde(scope.list[scope.entityIndex-2].properties.id).then(function(kohde) {
                                        EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                        ModalService.kohdeModal(kohde);
                                        });
                                    } else {
                                        KohdeService.getKohteet(q.query).then(function(data) {
                                            KohdeService.fetchKohde(data.features[data.features.length-1].properties.id).then(function(kohde) {
                                                EntityBrowserService.setQuery('kohde', kohde.properties.id, q.query, scope.query.totalCount);
                                                ModalService.kohdeModal(kohde);
                                            });
                                        });
                                    }
                                    break;
                                case 'tutkimus':
                                	TutkimusService.haeTutkimukset(q.query).then(function(data) {
                                		TutkimusService.haeTutkimus(data.features[data.features.length-1].properties.id).then(function(tutkimus) {
                                            EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, q.query, scope.query.totalCount);
                                            ModalService.tutkimusModal(true, tutkimus, null);
                                        });
                                    });
                                    break;
                                    case 'yksikko':
                                        YksikkoService.haeYksikot(q.query).then(function(data) {
                                            YksikkoService.haeYksikko(data.features[data.features.length-1].properties.id).then(function(yksikko) {
                                                EntityBrowserService.setQuery('yksikko', yksikko.properties.id, q.query, scope.query.totalCount);
                                                ModalService.yksikkoModal(yksikko);
                                            });
                                        });
                                        break;
                            }
                        } else {
                            if(i-1 >= 0) {
                                switch (scope.etype) {
                                    case 'kiinteisto':
                                        if(scope.query.query['mainmap'] == true) {
                                            KiinteistoService.fetchKiinteisto(scope.list[scope.entityIndex-2].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        } else {
                                            KiinteistoService.fetchKiinteisto(scope.list[i-1].properties.id).then(function(kiinteisto) {
                                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kiinteistoModal(kiinteisto, null);
                                            });
                                        }
                                        break;
                                    case 'rakennus':
                                        if(scope.query.query['mainmap'] == true) {
                                            RakennusService.fetchRakennus(scope.list[scope.entityIndex-2].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        } else {
                                            RakennusService.fetchRakennus(scope.list[i-1].properties.id).then(function(rakennus) {
                                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.rakennusModal(true, rakennus);
                                            });
                                        }
                                        break;
                                    case 'porrashuone':
                                        PorrashuoneService.fetchPorrashuone(scope.list[i-1].properties.id).then(function(ph) {
                                                EntityBrowserService.setQuery('porrashuone', ph.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.porrashuoneModal(true, ph);
                                            });
                                        break;
                                    case 'alue':
                                        if(scope.query.query['mainmap'] == true) {
                                            AlueService.fetchAlue(scope.list[scope.entityIndex-2].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.alueModal(true, alue);
                                            });
                                        } else {
                                            AlueService.fetchAlue(scope.list[i-1].properties.id).then(function(alue) {
                                                EntityBrowserService.setQuery('alue', alue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.alueModal(true, alue);
                                            });
                                        }
                                        break;
                                    case 'arvoalue':
                                        if(scope.query.query['mainmap'] == true) {
                                            ArvoalueService.fetchArvoalue(scope.list[scope.entityIndex-2].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        } else {
                                            ArvoalueService.fetchArvoalue(scope.list[i-1].properties.id).then(function(arvoalue) {
                                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.arvoalueModal(true, arvoalue);
                                            });
                                        }
                                        break;
                                    case 'kunta':
                                        KuntaService.fetchKunta(scope.list[i-1].properties.id).then(function(kunta) {
                                                EntityBrowserService.setQuery('kunta', kunta.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kuntaModal(true, kunta);
                                            });
                                        break;
                                    case 'kyla':
                                        KylaService.fetchKyla(scope.list[i-1].properties.id).then(function(kyla) {
                                                EntityBrowserService.setQuery('kyla', kyla.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.kylaModal(true, kyla);
                                            });
                                        break;
                                    case 'suunnittelija':
                                        if(scope.query.query['rakennus_id'] != undefined) {
                                            SuunnittelijaService.fetchSuunnittelija(scope.list[i-1].properties.id).then(function(suunnittelija) {
                                                EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.suunnittelijaModal(true, suunnittelija);
                                            });
                                        } else {
                                            SuunnittelijaService.fetchSuunnittelija(scope.list[i-1].properties.id).then(function(suunnittelija) {
                                                    EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, scope.query.query, scope.query.totalCount);
                                                    ModalService.suunnittelijaModal(true, suunnittelija);
                                                });
                                        }
                                        break;
                                    case 'inventointiprojekti':
                                        if(scope.query.query['kiinteisto_id'] != undefined || scope.query.query['alue_id'] != undefined
                                                || scope.query.query['arvoalue_id'] != undefined) {
                                            InventointiprojektiService.fetchInventointiprojekti(scope.list[scope.entityIndex-2].properties.id).then(function(ip) {
                                                EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                    ModalService.inventointiprojektiModal(true, ip);
                                            });
                                        } else {
                                            InventointiprojektiService.fetchInventointiprojekti(scope.list[i-1].properties.id).then(function(ip) {
                                                    EntityBrowserService.setQuery('inventointiprojekti', ip.properties.id, scope.query.query, scope.query.totalCount);
                                                    ModalService.inventointiprojektiModal(true, ip);
                                                });
                                        }
                                        break;
                                    case 'inventointijulkaisu':
                                        InventointijulkaisuService.fetchInventointijulkaisu(scope.list[i-1].properties.id).then(function(ij) {
                                                EntityBrowserService.setQuery('inventointijulkaisu', ij.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.inventointijulkaisuModal(ij, true);
                                            });
                                        break;
                                    case 'matkaraportti':
                                        MatkaraporttiService.fetchMatkaraportti(scope.list[i-1].properties.id).then(function(ij) {
                                                EntityBrowserService.setQuery('matkaraportti', ij.properties.id, scope.query.query, scope.query.totalCount);
                                                ModalService.matkaraporttiModal(ij, true);
                                            });
                                        break;
                                    case 'kayttaja':
                                        UserService.getUser(scope.list[i-1].properties.id).then(function(user) {
                                                EntityBrowserService.setQuery('kayttaja', user.id, scope.query.query, scope.query.totalCount);
                                                ModalService.userModal(user);
                                            });
                                        break;
                                    case 'loyto':
                                    	if(scope.query.query['ark_kartta_id'] != undefined || scope.query.query['ark_kuva_id'] !== undefined) {
                                            LoytoService.haeLoyto(scope.list[scope.entityIndex-2].properties.id).then(function(l) {
                                                EntityBrowserService.setQuery('loyto', l.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.loytoModal(l, false);
                                            });
                                        } else {
	                                        LoytoService.haeLoyto(scope.list[i-1].properties.id).then(function(loyto) {
	                                            EntityBrowserService.setQuery('loyto', loyto.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.loytoModal(loyto, false);
	                                        });
                                        }
                                        break;
                                    case 'nayte':
                                    	if(scope.query.query['ark_kartta_id'] != undefined || scope.query.query['ark_kuva_id'] !== undefined) {
                                            NayteService.haeNayte(scope.list[scope.entityIndex-2].properties.id).then(function(n) {
                                                EntityBrowserService.setQuery('nayte', n.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.nayteModal(n, false);
                                            });
                                        } else {
	                                        NayteService.haeNayte(scope.list[i-1].properties.id).then(function(nayte) {
	                                            EntityBrowserService.setQuery('nayte', nayte.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.nayteModal(nayte, false);
	                                        });
                                        }
                                        break;
                                    case 'kohde':
                                        if(scope.query.query['mainmap'] == true) {
                                            KohdeService.fetchKohde(scope.list[scope.entityIndex-2].properties.id).then(function(kohde) {
                                                EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount, scope.query.itemList);
                                                ModalService.kohdeModal(kohde);
                                            });
                                        } else {
	                                        KohdeService.fetchKohde(scope.list[i-1].properties.id).then(function(kohde) {
	                                            EntityBrowserService.setQuery('kohde', kohde.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.kohdeModal(kohde);
                                            });
                                        }
                                        break;
                                    case 'tutkimus':
                                    	TutkimusService.haeTutkimus(scope.list[i-1].properties.id).then(function(tutkimus) {
                                            EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, scope.query.query, scope.query.totalCount);
                                            ModalService.tutkimusModal(true, tutkimus, null);
                                        });
                                    break;
                                    case 'yksikko':
                                            YksikkoService.haeYksikko(scope.list[i-1].properties.id).then(function(yksikko) {
	                                            EntityBrowserService.setQuery('yksikko', yksikko.properties.id, scope.query.query, scope.query.totalCount);
	                                            ModalService.yksikkoModal(yksikko);
	                                        });
                                        break;
                                }
                            }
                        }
                        break;
                    }
                }
            }
            //close the previous dialog window, but add minor delay so it seems almost smooth...
            $timeout(function() {
                scope.disableButtons(false);
                scope.close();
            }, 750);
        };

        /*
         * First entity in the list?
         */
        scope.isFirst = function() {
            if(scope.entityIndex == 1) {
                return true;
            }
            return false;
        };

        /*
         * Last entity in the list?
         */
        scope.isLast = function() {
            if(scope.entityIndex == scope.query.totalCount) {
                return true;
            }

            return false;
        };

        /*
         * If the entity id is undefined, do not show the template.
         */
        scope.showTemplate = function() {
            if(scope.origEid == undefined) {
                return false
            }
            return true;
        };
    }
    return {
        link: link,
        scope: {
            etype: '=etype', //EntityType (e.g. kiinteisto, rakennus, porrashuone ...)
            eid : '=eid', //EntityId (the id of the opened object)
            close: '&'//"Inherit" the parent controller method close() for closing the modal dialog after the entity has been changed.
        },
        template: '<div ng-if="showTemplate()"><button type="button" class="btn btn-default" ng-click="changeEntity(false)" ng-disabled="isFirst() || buttonsDisabled"><i class="fa fa-arrow-left" aria-hidden="true"></i></button> {{entityIndex}} / {{query.totalCount}} <button type="button" class="btn btn-default" ng-click="changeEntity(true)" ng-disabled="isLast() || buttonsDisabled"><i class="fa fa-arrow-right" aria-hidden="true"></i></button></div>'

    };
}]);