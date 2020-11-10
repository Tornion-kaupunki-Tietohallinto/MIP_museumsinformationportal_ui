/**
 * Kirjautumisen testi.
 * Parametrit luetaan conf.js tai annetaan käynnistettäessä.
 * @returns
 */

var loginpage = require('./page-objects/login-page');

describe('MIP login', function() {
	
		  it('Kirjautuminen paakayttajana (url: '+browser.params.login.url + ')', function() {
		    
		    // Avaa login sivu
		    loginpage.get(browser.params.login.url);
		    
		    // Kirjautumistiedot 
		    loginpage.setUserEmail(browser.params.login.email);
		    loginpage.setPassword(browser.params.login.password);
		    
		    element(by.name('sbmt')).click();
		    
		    expect(browser.getTitle()).toEqual('MIP');
		    
		  });

});