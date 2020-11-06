/**
 * Navigoi läpi kaikki välilehdet
 */
describe('MIP navigaation testi', function() {
	  
	  it('Avaa kartta tab', function() {
		  element(by.id('2_tab')).click();
		  var map = element(by.css('angular-openlayers-map ng-isolate-scope'));
		  expect(map).not.toBeUndefined();
	  });
	  
	  it('Avaa raportit tab', function() {
		  element(by.id('3_tab')).click();
		  var firstCell = element(by.repeater('raporttipyynto in $data').row(1));
		  expect(firstCell).not.toBeUndefined();
	  });
	  
	  it('Avaa yllapito ja kayttajat tab', function() {
		  element(by.id('4_tab')).click();
		  var firstCell = element(by.repeater('user in $data').row(1));
		  expect(firstCell).not.toBeUndefined();
	  });
	  
	  it('Avaa yllapito ja inventointijulkaisut tab', function() {
		  element(by.id('4_tab')).click();
		  element(by.id('1_subtab')).click();
		  var firstCell = element(by.repeater('inventointijulkaisu in $data').row(1));
		  expect(firstCell).not.toBeUndefined();
	  });
	  
	  it('Avaa rakennusinventointi ja kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
		  var firstCell = element(by.repeater('kiinteisto in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	
	  it('Avaa rakennukset tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('1_subtab')).click();
		  var firstCell = element(by.repeater('rakennus in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa porrashuoneet tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('2_subtab')).click();
		  var firstCell = element(by.repeater('porrashuone in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  it('Avaa alueet tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('3_subtab')).click();
		  var firstCell = element(by.repeater('alue in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa arvoalueet tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('4_subtab')).click();
		  var firstCell = element(by.repeater('arvoalue in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa kunnat tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('5_subtab')).click();
		  var firstCell = element(by.repeater('kunta in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa kylat tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('6_subtab')).click();
		  var firstCell = element(by.repeater('kyla in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa suunnittelijat tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('7_subtab')).click();
		  var firstCell = element(by.repeater('suunnittelija in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa inventointiprojektit tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('8_subtab')).click();
		  var firstCell = element(by.repeater('inventointiprojekti in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
	  
	  it('Avaa matkaraportit tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('9_subtab')).click();
		  var firstCell = element(by.repeater('matkaraportti in $data').row(1));
		  expect(firstCell).not.toBeUndefined();	    
	  });
});