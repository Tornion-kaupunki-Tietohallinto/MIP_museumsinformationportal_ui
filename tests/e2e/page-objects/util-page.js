/**
 * Yleisten apu-funktioiden page object.
 */
var UtilPage = function(){
	
	/**
	 * Avaa valitun rivin.
	 * esim. repeaterName = 'inventointiprojekti in $data'
	 * rowNum = int 
	 */ 
	this.valitseTaulukonRivi = function(repeaterName, rowNum){
		var row = element(by.repeater(repeaterName).row(rowNum));
		
		row.click();
	};

	/**
	 * Modaalien Toiminnot-dropup valikon klikit.
	 * Toiminnot:
	 * - tallenna
	 * - muokkaa
	 * - muutoshistoria
	 * - sulje
	 * - poista
	 */
	this.suoritaToiminto = function(toiminto){
		// Avaa dropup
		element(by.buttonText('Toiminnot')).click();
		
		var link;
		
		if(toiminto === 'tallenna'){
			link = element(by.linkText('Tallenna'));
			link.click();
		}else if(toiminto === 'muokkaa'){
			link = element(by.css('[ng-click="editMode()"]'));
			link.click();
		}else if(toiminto === 'muutoshistoria'){
			link = element(by.css('[ng-click="showMuutoshistoria()"]'));
			link.click();
		}else if(toiminto === 'sulje'){
			link = element(by.linkText('Sulje'));
			link.click();
		}else if(toiminto === 'poista'){
			link = element(by.linkText('Poista'));
			link.click();
		}else{
			console.log("Toiminnot valinta ei kelpaa!")
		}
		 
	};
	
	/**
	 * Sulje modaali id:n mukaan
	 */ 
	this.suljeModaali = function(id){
		var close = element(by.id(id));
		close.click();
	};
	
	/**
	 * Hakee repeater nimen mukaan kaikki taulukon solut.
	 * Esim. repeaterName = 'h in historia'
	 * expect(cells.get(1).getText()).toEqual('jokin arvo');
	 */
	this.getTableCellsByRepeater = function(repeaterName){
		
		var tabledata =element.all(by.repeater(repeaterName));
		var rows = tabledata.all(by.tagName('tr'));
		var cells = rows.all(by.tagName('td'));
		return cells;
	};
	
	/**
	 * Return browser console log with a little bit of styling.
	 * TODO: Create a version that accepts 403 (or 404 when kuva_placeholder is not found) errors (because of windows) _IF NEEDED_!.
	 */
	this.checkConsoleErrors = function() {
	    var deferred = protractor.promise.defer();
	    
	    browser.manage().logs().get('browser').then(function (browserLog) {
	        var log = undefined;
	        if(browserLog.length > 0) {
	            log = '<div class="log"><br>';
	            for(var i = 0; i<browserLog.length; i++) {
	                var entry = browserLog[i];
	                log += ' <strong>Level:</strong> ' + entry.level;
	                log += ' <strong>Message:</strong> ' + entry.message;
	                log += ' <strong>Timestamp:</strong> ' + entry.timestamp;
	                log += ' <strong>Type:</strong> ' + entry.type;
	                log += '<br>';
	            }	            
	            log += '</div>'
	        }	        
	        
	        deferred.fulfill(log);	        
	    }, function(err) {
	        deferred.reject(err);
	    });
	    return deferred.promise;
	}

};

module.exports = new UtilPage();