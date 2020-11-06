/**
 * Navigoi läpi kaikki välilehdet ja jokaisesta avataan modali.
 * TODO: Yhdistä navigationSpecciin tai omiksi kokonaisuuksiksi
 * TODO: Avaa jokaisesta muutoshistoria ja muut "alinäkymät"
 */
var util = require('./page-objects/util-page');

describe('MIP modalinavigaatio testi', function() {
               
      it('Avaa rakennusinventointi ja kiinteistot tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('0_subtab')).click();
          var firstCell = element(by.repeater('kiinteisto in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan kiinteistö
      it('Avaa kiinteisto - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('kiinteisto in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'kiinteisto in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var kiinteistonTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(kiinteistonTiedotPanel).not.toBeUndefined();
          
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
    
      it('Avaa rakennukset tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('1_subtab')).click();
          var firstCell = element(by.repeater('rakennus in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan rakennus  
      it('Avaa rakennus - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('rakennus in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'rakennus in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var rakennuksenTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(rakennuksenTiedotPanel).not.toBeUndefined();
          var kuvauksetPanel = element(by.id('kuvauksetPanel'));
          expect(kuvauksetPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });      
      
      
      it('Avaa porrashuoneet tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('2_subtab')).click();
          var firstCell = element(by.repeater('porrashuone in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan porrashuone  
      it('Avaa porrashuone - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('porrashuone in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'porrashuone in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var porrashuoneenTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(porrashuoneenTiedotPanel).not.toBeUndefined();
          var kuvauksetPanel = element(by.id('kuvauksetPanel'));
          expect(kuvauksetPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa alueet tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('3_subtab')).click();
          var firstCell = element(by.repeater('alue in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan alue
      it('Avaa alue - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('alue in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'alue in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var alueenTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(alueenTiedotPanel).not.toBeUndefined();
          var muutTiedotPanel = element(by.id('muutTiedotPanel'));
          expect(muutTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
            
      it('Avaa arvoalueet tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('4_subtab')).click();
          var firstCell = element(by.repeater('arvoalue in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan arvoalue
      it('Avaa arvoalue - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('arvoalue in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'arvoalue in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var arvoalueenTiedotPanel = element(by.id('arvoaluePerusTiedotPanel'));
          expect(arvoalueenTiedotPanel).not.toBeUndefined();
          var sijaintiPanel = element(by.id('sijaintiPanel'));
          expect(sijaintiPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa kunnat tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('5_subtab')).click();
          var firstCell = element(by.repeater('kunta in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan kunta
      it('Avaa kunta - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('kunta in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'kunta in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var kuntaTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(kuntaTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa kylat tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('6_subtab')).click();
          var firstCell = element(by.repeater('kyla in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan kyla
      it('Avaa kyla - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('kyla in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'kyla in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var kylaTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(kylaTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa suunnittelijat tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('7_subtab')).click();
          var firstCell = element(by.repeater('suunnittelija in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan suunnittelija
      it('Avaa suunnittelija - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('suunnittelija in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'suunnittelija in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var suunnittelijaTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(suunnittelijaTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa inventointiprojektit tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('8_subtab')).click();
          var firstCell = element(by.repeater('inventointiprojekti in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan inventointiprojekti
      it('Avaa inventointiprojekti - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('inventointiprojekti in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'inventointiprojekti in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var ipTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(ipTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      it('Avaa matkaraportit tab', function() {
          element(by.id('0_tab')).click();
          element(by.id('9_subtab')).click();
          var firstCell = element(by.repeater('matkaraportti in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
      
      //Avataan matkaraportti
      it('Avaa matkaraportti - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('matkaraportti in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'matkaraportti in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var mrTiedotPanel = element(by.id('perusTiedotPanel'));
          expect(mrTiedotPanel).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });
      
      
      /*
      it('Avaa raportit tab', function() {
          element(by.id('2_tab')).click();
          var firstCell = element(by.repeater('raporttipyynto in $data').row(1));
          expect(firstCell).not.toBeUndefined();
      });
      */
    
      it('Avaa yllapito ja kayttajat tab', function() {
          element(by.id('4_tab')).click();
          element(by.id('0_subtab')).click();
          var firstCell = element(by.repeater('user in $data').row(1));
          expect(firstCell).not.toBeUndefined();
      });
      
      //Avataan kayttaja
      it('Avaa kayttaja - tarkasta sivu - sulje sivu', function() {

          var kayttajaModaaliId = 'Kayttaja_modal';
          var firstCell = element(by.repeater('user in $data').row(0));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'user in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var etunimi = element(by.model('user.etunimi'));
          expect(etunimi).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suljeModaali(kayttajaModaaliId);
      });
      
      it('Avaa inventointijulkaisut tab', function() {
          element(by.id('4_tab')).click();
          element(by.id('1_subtab')).click();
          var firstCell = element(by.repeater('matkaraportti in $data').row(1));
          expect(firstCell).not.toBeUndefined();        
      });
            
      //Avataan inventointijulkaisu
      it('Avaa inventointijulkaisu - tarkasta sivu - sulje sivu', function() {
          var firstCell = element(by.repeater('inventointijulkaisu in $data').row(1));
          expect(firstCell).not.toBeUndefined();
          
          var repeater = 'inventointijulkaisu in $data';          
          //Valitaan ensimmäinen rivi
          util.valitseTaulukonRivi(repeater, 0);
                    
          //Tarkastetaan, että muutamia elementtejä löytyy sivulta          
          var modalHeader = element(by.css('modal-header ui-draggable-handle'));
          expect(modalHeader).not.toBeUndefined();  
          var perustiedot = element(by.id('perusTiedotPanel'));
          expect(perustiedot).not.toBeUndefined();
          //TODO: Jos halutaan muita tarkastuksia, laitetaan ne tähän.
          
          //Suljetaan modal
          util.suoritaToiminto('sulje');
      });      
});