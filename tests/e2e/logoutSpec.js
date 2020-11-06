/**
 * Kirjautumisen testi.
 * Parametrit luetaan conf.js tai annetaan käynnistettäessä.
 * @returns
 */

describe('MIP logout', function() {
	  it('Kirjaudutaan ulos', function() {
	    
	    //Avataan valikko      
	    element(by.css('[name="usrEmail"]')).click();
	    element(by.css('[ng-click="logout()"]')).click();
	    browser.sleep(2000);
	    browser.pause();
	    expect(browser.getCurrentUrl()).toContain('/kirjaudu');		    
	  });
});