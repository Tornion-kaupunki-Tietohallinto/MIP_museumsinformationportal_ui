angular.module('mip.directives').directive('mipNayteValitsin', [
        'locale', 'NayteService', 'AlertService', '$rootScope', function(locale, NayteService, AlertService, $rootScope) {
            /**
             * Direktiivi jolla voi valita yksiköitä ja löytöjä
             */
            function link(scope, elem, attrs) {
            	if(scope.valitutNaytteet === undefined || scope.valitutNaytteet === null) {
            		scope.valitutNaytteet = [];
            	}

            	//Onko vähintään 1 linkkaus pakollinen
            	if(scope.req === undefined) {
            		scope.req = true;
            	}

            	//Mihin muihin entiteetteihin ko. itemi on linkattu (yksiköt, löydöt)
            	scope.linkedLoytoCount = 0;
            	scope.linkedYksikkoCount = 0;

            	$rootScope.$on('mip-linkitys', function (event, data) {
            		//Tämä entiteetti kyseessä
            		if(data.entityId && data.entityId === scope.entityId && data.mode === scope.mode) {
            			scope.linkedLoytoCount = data.loytoCount;
            			scope.linkedYksikkoCount = data.yksikkoCount;
            		}
            	});

                scope.nayteHaku = function(nhaku){
                	// Röntgenkuville voidaan hakea näytteitä myös eri tutkimuksilta eli haetaan ilman tutkimusId:tä.
                	if(scope.mode === 'xray'){
                        NayteService.haeNaytteet({'luettelointinumero': nhaku}).then(function (result) {
                       	 scope.nhakutulos = [];

                       	 var tmp = [];
                       	 tmp = result.features.filter(function(i) {
                       		 return scope.valitutNaytteet.map(function(e) {
                       			 return e.id;
                       		 }).indexOf(i.properties.id) < 0;
                       	 });

                       	 for (var i = 0; i<tmp.length; i++) {
                       		 scope.nhakutulos.push(tmp[i].properties);
                       	 }
                        });
                	}else{
                        NayteService.haeNaytteet({'luettelointinumero': nhaku, 'ark_tutkimus_id': scope.tutkimusId}).then(function (result) {
                       	 scope.nhakutulos = [];

                       	 var tmp = [];
                       	 tmp = result.features.filter(function(i) {
                       		 return scope.valitutNaytteet.map(function(e) {
                       			 return e.id;
                       		 }).indexOf(i.properties.id) < 0;
                       	 });

                       	 for (var i = 0; i<tmp.length; i++) {
                       		 scope.nhakutulos.push(tmp[i].properties);
                       	 }
                        });
                	}
                 };

                 scope.addItemBackToList = function(item, model) {
                     for (var i = 0; i < model.length; i++) {
                         if (model[i].id == item.id) {
                             return;
                         }
                     }
                     model.push(item);
                 };

                 scope.addNayte = function(nayte) {
                	 scope.valitutNaytteet.push(nayte);
                	 $rootScope.$broadcast('mip-linkitys', {
                		 mode : scope.mode,
            			 entityId : scope.entityId,
            			 loytoCount : scope.linkedLoytoCount,
            			 yksikkoCount : scope.linkedYksikkoCount,
            			 nayteCount : scope.valitutNaytteet.length
            		 });
                 };

                 //Huom: ui-selectin bugin takia listalta poistetaan elementti ennen kuin poiston tekevä
             	 //metodi suoritetaan https://github.com/angular-ui/ui-select/issues/463
                 //ui-selectin model on valitutLoydot, mutta silti se palauttaa erillisen modellin jota on muokattu.
                 //jos ollaan poistamassa viimeistä linkatttua elementtiä, palautetaan viimeisin poistettu elementti
                 //ja näytetään ilmoitus että vimoista linkkausta ei voida poistaa.
                 //Samalla ylläpidetään scopen modelia jossa elementit on (valitutLoydot)
                 scope.deleteNayte = function(itemToDelete, list) {
                	 if(list.length === 0 && scope.linkedLoytoCount === 0 && scope.linkedYksikkoCount === 0 && scope.req === true) {
                		 list.push(itemToDelete);
                		 AlertService.showWarning(locale.getString('common.Cannot_remove_last_linked_item'));
                	 } else {
                		 scope.valitutNaytteet = list;
                		 $rootScope.$broadcast('mip-linkitys', {
                			 mode : scope.mode,
                			 entityId : scope.entityId,
                			 loytoCount : scope.linkedLoytoCount,
                			 yksikkoCount : scope.linkedYksikkoCount,
                			 nayteCount : scope.valitutNaytteet.length
                		 });
                	 }
                 };
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                	valitutNaytteet: '=',
                	entityId : '=',
                    tutkimusId: '=',
                	mode : '=',
                    dis : '=',
                    req : '=?'
                },
                transclude: true,
                templateUrl : 'ark/directives/naytevalitsin/mipnaytevalitsin.html'
            };
        }
]);