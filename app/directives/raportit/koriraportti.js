angular.module('mip.directives').directive('mipKoriraportti', ['locale', function(locale) {
    function link(scope) {

        /*
         * RAPORTILLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.valittavissaolevatKentat = null;

        /*
         * RAPORTILLE PAKOLLISET KENTÄT JA ESIVALITUT KENTÄT
         * Pakolliset: Käyttäjä ei voi poistaa valinnoista
         * Esivalitut: "Kalannin raportissa" olevat kentät
         */
        scope.raportti.valitutKentat = null;

        /*
         * RAK RAPORTIN LAJIT (KIINTEISTOT, RAKENNUKSET, ALUEET, ARVOALUEET).
         * ARK raportit: LOYDOT, NAYTTEET
         * Raportin tyyppi (suoritettava .jasper raportti) määräytyy lajin perusteella.
         */
        scope.raportti.laji = "";

        scope.kiinteistoNimi = locale.getString('common.Estates');
        scope.rakennusNimi = locale.getString('common.Buildings');
        scope.alueNimi = locale.getString('common.Areas');
        scope.arvoalueNimi = locale.getString('common.Valueareas');

        scope.loytoNimi = locale.getString('ark.Discoveries');
        scope.nayteNimi = locale.getString('ark.Samples');


        /*
         * RAPORTIN MAHDOLLISET LAJIT
         */
        scope.lajit = [
            {id:'kiinteisto', name: scope.kiinteistoNimi},
            {id:'rakennus', name: scope.rakennusNimi},
            {id:'alue', name: scope.alueNimi},
            {id:'arvoalue', name: scope.arvoalueNimi},
            {id:'ark_loyto', name: scope.loytoNimi},
            {id:'ark_nayte', name: scope.nayteNimi}
        ];

        /*
         * RAPORTIN HAKUEHTOIHIN VALITTU PAIKKAKUNTA
         */
        scope.raportti.paikkakunta = "";
        /*
         * RAPORTIN KÄYTTÄJÄLLE NÄYTETTÄVÄ NIMI
         */
        scope.raportti.reportDisplayName = "";

        /*
         * KIINTEISTÖLLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.kiinteistoValittavissaolevatKentat = [
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
         * RAKENNUKSELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.rakennusValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'osoitteet',
                'label': locale.getString('common.Addresses')
            },{
                'editable': true,
                'name': 'postinumero',
                'label': locale.getString('common.Postal_code')
            }, {
                'editable': true,
                'name': 'rakennustunnus',
                'label': locale.getString('common.Building_identifier')
            }, {
                'editable': true,
                'name': 'rakennustyypit',
                'label': locale.getString('common.Building_type')
            }, {
                'editable': true,
                'name': 'rakennustyyppi_kuvaus',
                'label': locale.getString('common.Building_type_description')
            }, {
                'editable': true,
                'name': 'rakennusvuosi',
                'label': locale.getString('common.Construction_year')
            }, {
                'editable': true,
                'name': 'rakennusvuosi_selite',
                'label': locale.getString('common.Construction_year_description')
            }, {
                'editable': true,
                'name': 'muutosvuodet',
                'label': locale.getString('common.Alteration_years')
            }, {
                'editable': true,
                'name': 'alkuperainen_kaytto',
                'label': locale.getString('common.Original_usage')
            }, {
                'editable': true,
                'name': 'nykykaytto',
                'label': locale.getString('common.Common_usage')
            }, {
                'editable': true,
                'name': 'kerroslukumaara',
                'label': locale.getString('common.Number_of_floors')
            }, {
                'editable': true,
                'name': 'asuin_ja_liikehuoneistoja',
                'label': locale.getString('common.Residences_and_offices')
            }, {
                'editable': true,
                'name': 'perustus',
                'label': locale.getString('common.Foundation')
            }, {
                'editable': true,
                'name': 'runko',
                'label': locale.getString('common.Frame')
            }, {
                'editable': true,
                'name': 'vuoraus',
                'label': locale.getString('common.Lining')
            }, {
                'editable': true,
                'name': 'ulkovari',
                'label': locale.getString('common.Outside_color')
            }, {
                'editable': true,
                'name': 'kattotyypit',
                'label': locale.getString('common.Ceiling')
            }, {
                'editable': true,
                'name': 'katetyypit',
                'label': locale.getString('common.Cover')
            }, {
                'editable': true,
                'name': 'kunto',
                'label': locale.getString('common.Condition')
            }, {
                'editable': true,
                'name': 'nykytyyli',
                'label': locale.getString('common.Contemporary_style')
            }, {
                'editable': true,
                'name': 'purettu',
                'label': locale.getString('common.Demolished')
            }, {
                'editable': true,
                'name': 'erityispiirteet',
                'label': locale.getString('common.Special_characteristics')
            }, {
                'editable': true,
                'name': 'suunnittelija',
                'label': locale.getString('common.Architects')
            }
        ];

        /*
         * ALUEELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.alueValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'historia',
                'label': locale.getString('common.History')
            }, {
                'editable': true,
                'name': 'maisema',
                'label': locale.getString('common.Scenery')
            }, {
                'editable': true,
                'name': 'nykytila',
                'label': locale.getString('common.Current_condition')
            }
        ];

        /*
         * ARVOALUEELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.arvoalueValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'aluetyyppi',
                'label': locale.getString('common.Area_type')
            }, {
                'editable': true,
                'name': 'arvoluokka',
                'label': locale.getString('common.Valuation')
            }, {
                'editable': true,
                'name': 'kulttuurihistorialliset_arvot',
                'label': locale.getString('common.Culturohistorical_values')
            }, {
                'editable': true,
                'name': 'perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'yhteenveto',
                'label': locale.getString('common.Summary')
            }
        ];

        /*
         * LÖYDÖLLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.loytoValittavissaolevatKentat = [];

        /*
         * NÄYTTEELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.nayteValittavissaolevatKentat = [];

        scope.selectValittavissaolevatKentat = function(laji) {
            if(laji == 'kiinteisto') {
                scope.valittavissaolevatKentat = scope.kiinteistoValittavissaolevatKentat;
            } else if(laji == 'rakennus') {
                scope.valittavissaolevatKentat = scope.rakennusValittavissaolevatKentat;
            } else if(laji == 'alue') {
                scope.valittavissaolevatKentat = scope.alueValittavissaolevatKentat;
            } else if(laji == 'arvoalue') {
                scope.valittavissaolevatKentat = scope.arvoalueValittavissaolevatKentat;
            } else if(laji == 'ark_loyto') {
                scope.valittavissaolevatKentat = scope.loytoValittavissaolevatKentat;
            } else if(laji == 'ark_nayte') {
                scope.valittavissaolevatKentat = scope.nayteValittavissaolevatKentat;
            }
        };


        scope.kiinteistoValitutKentat = [
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

        scope.rakennusValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': false,
                'name': 'kiinteisto',
                'label': locale.getString('common.Estate')
            }, {
                'editable': false,
                'name': 'kiinteistotunnus',
                'label': locale.getString('common.Property_identifier')
            }, {
                'editable': true,
                'name': 'inventointinumero',
                'label': locale.getString('common.Inventory_number')
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
                'name': 'kulttuurihistoriallisetarvot_perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'rakennuksen_sijainti',
                'label': locale.getString('common.Location')
            }
        ];

        scope.alueValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': false,
                'name': 'nimi',
                'label': locale.getString('common.Area')
            }, {
                'editable': true,
                'name': 'alueen_sijainti',
                'label': locale.getString('common.Location')
            }
        ];

        scope.arvoalueValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': false,
                'name': 'Arvoalue',
                'label': locale.getString('common.Valuearea')
            }, {
                'editable': true,
                'name': 'alue',
                'label': locale.getString('common.Area')
            }, {
                'editable': true,
                'name': 'inventointinumero',
                'label': locale.getString('common.Inventory_number')
            }, {
                'editable': true,
                'name': 'arvoalueen_sijainti',
                'label': locale.getString('common.Location')
            }
        ];

        scope.loytoValitutKentat = [];

        scope.nayteValitutKentat = [];


        /*
         * Muunnettu korilta saatavan tyypin (taulu) mukaan. Asetetaan laji jasperille.
         */
        scope.selectValitutKentat = function(laji) {
            if(laji == 'kiinteisto') {
            	scope.raportti.laji = 'kiinteistot';
            	scope.valittuNimi = scope.kiinteistoNimi;
                scope.raportti.valitutKentat = scope.kiinteistoValitutKentat;
            } else if(laji == 'rakennus') {
            	scope.raportti.laji = 'rakennukset';
            	scope.valittuNimi = scope.rakennusNimi;
                scope.raportti.valitutKentat = scope.rakennusValitutKentat;
            } else if(laji == 'alue') {
            	scope.raportti.laji = 'alueet';
            	scope.valittuNimi = scope.alueNimi;
                scope.raportti.valitutKentat = scope.alueValitutKentat;
            } else if(laji == 'arvoalue') {
            	scope.raportti.laji = 'arvoalueet';
            	scope.valittuNimi = scope.arvoalueNimi;
                scope.raportti.valitutKentat = scope.arvoalueValitutKentat;
            } else if(laji == 'ark_loyto') {
            	scope.raportti.laji = 'loydot';
            	scope.valittuNimi = scope.loytoNimi;
                scope.raportti.valitutKentat = scope.loytoValitutKentat;
            } else if(laji == 'ark_nayte') {
            	scope.raportti.laji = 'naytteet';
            	scope.valittuNimi = scope.nayteNimi;
                scope.raportti.valitutKentat = scope.nayteValitutKentat;
            }
        };

        scope.selectReportDisplayName = function(laji) {
            scope.raportti.reportDisplayName = locale.getString('common.Cart_list_report') + " - " + scope.valittuNimi;
        };

        scope.selectLaji = function(laji) {
            scope.raportti.laji = laji;
            scope.selectValittavissaolevatKentat(laji);
            scope.selectValitutKentat(laji);
            scope.selectReportDisplayName(laji);
        };
        scope.selectLaji(scope.laji);
    }
    return {
        scope : {
            raportti: '=',
            laji: '='
        },
        restrict : 'E',
        link: link,
        templateUrl: 'directives/raportit/koriraportti.html'
    };
}]);