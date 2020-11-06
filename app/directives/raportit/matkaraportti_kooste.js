angular.module('mip.directives').directive('mipMatkaraporttikooste', 
        ['locale', 'MatkaraporttiService', 'ListService', 'UserService', 'KiinteistoService', function(locale, MatkaraporttiService, ListService, UserService, KiinteistoService) {
    function link(scope) {
        /*
         * MATKARAPORTILLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.valittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'matkapvm',
                'label': locale.getString('common.Travel_date')
            }, {
                'editable': true,
                'name': 'kayttaja_nimi',
                'label': locale.getString('common.User') + " (" + locale.getString('common.Firstname') + " " + locale.getString('common.Lastname') + ")"
            }, {
                'editable': true,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': true,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': true,
                'name': 'kiinteistotunnus',
                'label': locale.getString('common.Property_identifier')
            }, {
                'editable': true,
                'name': 'kiinteisto_nimi',
                'label': locale.getString('common.Estate_name')
            }, {
                'editable': true,
                'name': 'kaavoitus',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Zoning')
            }, {
                'editable': true,
                'name': 'katselmus',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Review')
            }, {
                'editable': true,
                'name': 'korjaus',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Repair')
            }, {
                'editable': true,
                'name': 'korjausneuvonta',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Repair_advice')
            }, {
                'editable': true,
                'name': 'rakennussuojelu',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Building_protection')
            }, {
                'editable': true,
                'name': 'tarkastus',
                'label': locale.getString("common.Reason") + " - " + locale.getString('common.Inspection')
            }
        ];
        
        /*
         * RAPORTILLE PAKOLLISET KENTÄT JA ESIVALITUT KENTÄT
         * Pakolliset: Käyttäjä ei voi poistaa valinnoista
         * Esivalitut: "Kalannin raportissa" olevat kentät
         */
        
        scope.raportti.valitutKentat = [
            /*
            {
                'editable': false,
                'name': 'kunta_nimi',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla_nimi',
                'label': locale.getString('common.Village')
            }, {               
                'editable': false,
                'name': 'kiinteisto_nimi',
                'label': locale.getString('common.Estate')
            }, {
                'editable': false,
                'name': 'kiinteistotunnus',
                'label': locale.getString('common.Property_identifier')
            }, {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'kulttuurihistorialliset_arvot',
                'label': locale.getString('common.Culturohistorical_values')
            }, {
                'editable': true,
                'name': 'arvoluokka',
                'label': locale.getString('common.Valuation')
            }, {
                'editable': true,
                'name': 'perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'kiinteiston_sijainti',
                'label': locale.getString('common.Location')
            }
            
        */
        ];
        
        scope.raportti.reportDisplayName = "Matkaraporttikooste";
        scope.raportti.report_name = "Kooste";
        scope.kiinteisto = {};
        
        /*
         * Matkaraportinsyy
         */
        scope.syyOptions = [];

        scope.getSyyOptions = function() {
           ListService.getOptions('matkaraportinsyy').then(function success(options) {
               scope.syyOptions = options;                          
           }, function error() {
               locale.ready('error').then(function() {
                   AlertService.showError(locale.getString('common.Get_selection_list_failed', {
                       cat : locale.getString('common.Reasons')
                   }));
               });
           });                      
        };
        scope.getSyyOptions();
        
        /*
         * Kiinteisto
         */
        scope.kiinteistot = [];
        scope.getKiinteistot = function(search) {
            var searchObj = {
                    'rivit': 50
            };
            var pattern = /^\d{3}-/;
            if(pattern.test(search)) {
                searchObj['kiinteistotunnus'] = search;
                searchObj['jarjestys'] = 'kiinteistotunnus'
            } else {
                searchObj['nimi'] = search;
                searchObj['jarjestys'] = 'nimi';
            }
            KiinteistoService.getKiinteistot(searchObj).then(function success(data) {
                scope.kiinteistot.length = 0;

                scope.kiinteistot = data.features;
            }, function error(data) {
                locale.ready('error').then(function() {
                    AlertService.showError(locale.getString('error.Getting_estates_failed'), AlertService.message(data));
                });
            });

        };
        scope.getKiinteistot();                
        /*
         * Helper function - The original selection list items are filtered so that the already selected items are not present This method puts the items back to the list if/when they are removed.
         */
        scope.addItemBackToList = function(item, model) {
            for (var i = 0; i < model.length; i++) {
                if (model[i].id == item.id) {
                    return;
                }
            }
            model.push(item);
        };
        
        /*
         * Users
         */
        scope.kayttajat = [];
        scope.getUsers = function() {
            UserService.getUsers({
                'rivit' : 10000000,
                'aktiivinen' : 'true'
            }).then(function success(data) {
                scope.kayttajat = data.features;
            }, function error(data) {
                locale.ready('error').then(function() {
                    AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                });
            });                    
        };

        scope.getUsers();            
    }
    return {
        scope : {
            raportti: '='
        },
        restrict : 'E',
        link: link,        
        templateUrl: 'directives/raportit/matkaraportti_kooste.html'        
    };   
}]);