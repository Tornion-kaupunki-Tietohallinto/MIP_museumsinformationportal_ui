angular.module('mip.directives').directive('mipPerustietoraportti', ['locale', function(locale) {
    function link(scope) {
        /*
         * PERUSTIETORAPORTILLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.valittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'historialliset_tilatyypit',
                'label': locale.getString('common.Historical_property_types')
            }, {
                'editable': true,
                'name': 'lisatiedot',
                'label': locale.getString('common.Additional_information')
            }, {
                'editable': true,
                'name': 'perustelut_yhteenveto',
                'label': locale.getString('common.Summary')
            }, {
                'editable': true,
                'name': 'asutushistoria',
                'label': locale.getString('common.Settlement_history')
            }, {
                'editable': true,
                'name': 'lahiymparisto',
                'label': locale.getString('common.Surroundings')
            }, {
                'editable': true,
                'name': 'pihapiiri',
                'label': locale.getString('common.Courtyard')
            }, {
                'editable': true,
                'name': 'arkeologinen_intressi',
                'label': locale.getString('common.Archeological_interests')
            }, {
                'editable': true,
                'name': 'muu_historia',
                'label': locale.getString('common.Other_history')
            }, {
                'editable': true,
                'name': 'tarkistettu',
                'label': locale.getString('common.Inspected')
            }, {
                'editable': true,
                'name': 'palstanumero',
                'label': locale.getString('common.Column_number')
            }
        ];
        
        /*
         * PERUSTIETORAPORTILLE PAKOLLISET KENTÄT JA ESIVALITUT KENTÄT
         * Pakolliset: Käyttäjä ei voi poistaa valinnoista
         * Esivalitut: "Kalannin raportissa" olevat kentät
         */
        scope.raportti.valitutKentat = [
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
        ];
        
        //Raportille valitut paikkakunnat
        scope.raportti.paikkakuntaSelections = [];
        
        scope.raportti.reportDisplayName = "Kiinteistoraportti";
        
        scope.addPaikkakuntaSelection = function() {            
            var p = {
                    value: ""
            };
            scope.raportti.paikkakuntaSelections.push(p);
        };
        
        scope.deletePaikkakuntaSelection = function(index) {
            scope.raportti.paikkakuntaSelections.splice(index, 1);
        };
        
    }
    return {
        scope : {
            raportti: '='
        },
        restrict : 'E',
        link: link,        
        templateUrl: 'directives/raportit/perustietoraportti.html'        
    };   
}]);