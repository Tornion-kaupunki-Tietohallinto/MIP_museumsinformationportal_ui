angular.module('mip.filters', []);

angular.module('mip.filters').filter('trusted', [
        '$sce', function($sce) {
            return function(html) {
                return $sce.trustAsResourceHtml(html);
            }
        }
]).filter('to_trusted', [
        '$sce', function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            }
        }
]).filter('propsFilter', function() {
    /**
     * AngularJS default filter with the following expression:
     * "person in people | filter: {name: $select.search, age: $select.search}"
     * performs an AND between 'name: $select.search' and 'age: $select.search'.
     * We want to perform an OR.
     */
    return function(items, props) {
        var out = [];

        if (angular.isArray(items)) {
            var keys = Object.keys(props);

            items.forEach(function(item) {
                var itemMatches = false;

                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
}).filter('nimi_fiFilter', function() {
    return function(items, props) {
        var out = [];

        if (angular.isArray(items)) {
            var keys = Object.keys(props);

            items.forEach(function(item) {
                var itemMatches = false;

                for (var i = 0; i < keys.length; i++) {
                    if (keys[i] == 'nimi_fi') {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    } else {
                        continue;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
}).filter('kayttaja', function() {
    //
    return function(user) {
        if (!user || user == null) {
            return '';
        }
        var u = user.etunimi + ' ' + user.sukunimi;
        return u;
    };
}).filter('pvm', [
        '$filter', function(filter) {
            var dateFilter = filter('date');
            return function(pvm, options) {
                if (!pvm || pvm == null) {
                    return '';
                }
                if (pvm.length > 10) {
                    var isopvm = pvm.substring(0, 10) + 'T' + pvm.substring(11);
                    // is there timezone at the end (+03 for example)
                    var tzstart = isopvm.lastIndexOf('+');
                    if (tzstart > -1) {
                        // check if the length of tz is less than 4 and add zeroes after it.
                        // resulting +03 -> +0300
                        while (isopvm.substring(tzstart + 1).length < 4) {
                            isopvm = isopvm + '0';
                        }
                    }
                    return dateFilter(isopvm, options);
                } // else
                return dateFilter(pvm, options);
            };
        }
]).filter('pvm_kuvaus', [
    '$filter', function(filter) {
        var dateFilter = filter('date');
        return function(pvm, options) {
            if (!pvm || pvm === null) {
                return '';
            }
            if (pvm.length > 10) {

                var temp = pvm.split(" ");

                var datePart = temp[0].split("-");

                var yyyy = datePart[0];
                var mm = datePart[1];

                if(mm.length < 2) {
                    mm = '0' + mm;
                }

                var dd = datePart[2];

                if(dd.length < 2) {
                    dd = '0' + dd;
                }

                var timePart = temp[1].split(":");

                var hh = timePart[0];

                if(hh.length < 2) {
                    hh = '0' + hh;
                }

                var min = timePart[1];

                if(min.length < 2) {
                    min = '0' + min;
                }

                var ss = timePart[2];

                if(ss.length < 2) {
                    ss = '0' + ss;
                }


                var isopvm = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + min + ":" + ss;
                //var isopvm = pvm.substring(0, 10) + 'T' + pvm.substring(11);
                // is there timezone at the end (+03 for example)
                var tzstart = isopvm.lastIndexOf('+');
                if (tzstart > -1) {
                    // check if the length of tz is less than 4 and add zeroes after it.
                    // resulting +03 -> +0300
                    while (isopvm.substring(tzstart + 1).length < 4) {
                        isopvm = isopvm + '0';
                    }
                }
                return dateFilter(isopvm, options);
            } // else
            return dateFilter(pvm, options);
        };
    } //lisätään filtteriin jotenkin sopiva toiminnallisuus jotta kuvan päivämäärät toimivat? tai lisää uusi filtteri 'kuvauspvm'

    //tämä filteri toimii valintalistoihin joissa ei ole kunta tai kylä vaihtoehtoa
]).filter('namei18n', [
        'locale', function(locale) {
            return function(obj) {
                if (!obj || obj == null) {
                    return '';
                }
                var lc = locale.getLocale();
                if (!lc) {
                    return obj.nimi_fi;
                }

                if (lc === 'sv-FI') {
                	if (obj.nimi_se == null || obj.nimi_se === undefined || obj.nimi_se.length === 0) {
                		if(obj.nimi_fi == null || obj.nimi_fi === undefined) {
                			return obj.nimi;
                		} else {
                			return obj.nimi_fi;
                		}
                    } else {
                		return obj.nimi_se;
                	}
                } else if (lc === 'en-US') {
                    return obj.nimi_en;
                }

                return obj.nimi_fi;
            };
        }

        //tämä filteri tomimii kunta kylä parametrissä ja muissa jossa on fi-FI on nimi ja sv-FI on nimi_se
]).filter('kuntaKylaNamei18n', [
    'locale', function(locale) {
        return function(obj) {
            if (!obj || obj == null) {
                return '';
            }
            var lc = locale.getLocale();
            if (!lc) {
                return obj.nimi;
            }

            if (lc === 'sv-FI') {
            	if (obj.nimi_se == null || obj.nimi_se === undefined || obj.nimi_se.length === 0) {
            		return obj.nimi;
                } else {
            		return obj.nimi_se;
            	}
            } else if (lc === 'en-US') {
                return obj.nimi_en;
            }

            return obj.nimi;
        };
    }
]).filter('capitalize', [
    function() {
        return function(input) {
            if (angular.isArray(input)) {
                return input
            } else {
                return (input.length > 0) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
            }
        }
    }
]).filter('MMLnamei18n', [
        'locale', function(locale) {
            // Returns the nimi_fi value for fi-FI and en-US locale and nimi_se value for sv-FI locale.
            // IF object doesn't have nimi_fi or nimi_se value, the object itself is returned.
            return function(obj) {
                var lc = locale.getLocale();

                if (!obj || obj == null) {
                    return '';
                } else {
                    // No locale available, return the finnish value or the object itself
                    if (!lc) {
                        if (obj.nimi_fi != null) {
                            return obj.nimi_fi + " (" + obj.arvo + ")";
                            ;
                        } else {
                            return obj;
                        }
                    }
                    // Swedish value
                    if (lc === 'sv-FI') {
                        if (obj.nimi_se != null) {
                            return obj.nimi_se + " (" + obj.arvo + ")";
                            ;
                        } else {
                            return obj;
                        }
                    } else {

                        if (obj.nimi_fi != null) {
                            return obj.nimi_fi + " (" + obj.arvo + ")";
                        } else {
                            return obj;
                        }
                    }
                }
            };
        }
]).filter('Filesize', function() {
    return function(size) {
        if (isNaN(size))
            size = 0;

        if (size < 1024)
            return size + ' Bytes';

        size /= 1024;

        if (size < 1024)
            return size.toFixed(0) + ' Kb';

        size /= 1024;

        if (size < 1024)
            return size.toFixed(2) + ' Mb';

        size /= 1024;

        if (size < 1024)
            return size.toFixed(2) + ' Gb';

        size /= 1024;

        return size.toFixed(2) + ' Tb';
    };
}).filter('trueFalseToText', ['locale', function(locale) {
    return function(value) {
        if (value != null || value != undefined) {
            if (value == 'false' || value == false || value == 'f') {
                return locale.getString('common.No');
            } else if (value == 'true' || value == true || value == 't') {
                return locale.getString('common.Yes');
            }
        } else {
            return value;
        }
    };
}]).filter('nimiFilter', ['locale', function(locale) {
    /*
     * Filtteri jolla voidaan suodattaa valintalistojen arvoja käyttäjän kielen mukaan.
     */
    return function(items, props) {
        var out = []; // Output list
        var curLocale = locale.getLocale(); //Current locale
        if(props.nimi === '') { //Return the input list if no search word provided.
            return items;
        }
        if(!angular.isArray(items)) { //Return input if it's not a list
            return items;
        }

        for(var i = 0; i<items.length; i++) {
            if(curLocale === 'fi-FI') {
                if(items[i].nimi_fi && items[i].nimi_fi.toLowerCase().indexOf(props.nimi.toLowerCase()) > -1) {
                    out.push(items[i]);
                }
            } else if(curLocale === 'sv-FI') {
                if(items[i].nimi_se && items[i].nimi_se.toLowerCase().indexOf(props.nimi.toLowerCase()) > -1) {
                    out.push(items[i]);
                }
            }
        }

        return out;
    };
}]).filter('mipOutputFilename', [function() {
    /*
     * Filtteri joka ottaa polusta ainoastaan viimeisen osan / tai \ merkin jälkeen.
     */
    return function(item) {
        //If lastIndexOf doesn't work, use
        //return pattern = path.match(/\/([^\/]+)\/?$/)[1]; //take everything after the last slash

        if(item == null) {
            return item;
        }

        var filename = "";
        //If the path doesn't have a single / chars, check if it has \ chars

        if(item.indexOf('/') === -1) {
            filename = item.substr(item.lastIndexOf('\\') + 1);
        } else {
            filename = item.substr(item.lastIndexOf('/') + 1);
        }

        return filename;
    };
}]).filter('mipReportStatusTranslator', ['locale', function(locale) {
    /*
     * Filtteri joka ottaa polusta ainoastaan viimeisen osan / tai \ merkin jälkeen.
     */
    return function(statusId) {
        var statusText = "";

        switch (statusId) {
            case 0:
                statusText = locale.getString('common.Created');
                break;
            case 1:
                statusText = locale.getString('common.Queued');
                break;
            case 2:
                statusText = locale.getString('common.Running');
                break;
            case 3:
                statusText = locale.getString('common.Success');
                break;
            case 4:
                statusText = locale.getString('common.Failed');
                break;
        }

        return statusText;
    };
}]).filter('mipReportDisplayName', [function() {
    return function(parameters) {
        var name = "";
        for(var i = 0; i<parameters.length; i++) {
            if(parameters[i].name === 'reportDisplayName') {
                return parameters[i].value;
            }
        }
        return name;
    }
}]).filter('mipShortModalNameId', [function() {
	/*
	 * Poistetaan ikkunavalikon modalNameId tunnisteiden yksilöivä osa näytöltä
	 */
    return function(modalNameId) {
    	var shortNameId = "Puuttuu";
    	if(modalNameId != undefined){
            var i = modalNameId.indexOf('|');
            shortNameId = modalNameId.substring(0, i);
    	}

        return shortNameId;
    }
}]).filter('mipModalPrefix', [function() {
	/*
	 * Palauttaa modaalin nimen alkuosan ilman ääkkösiä + _modal esim. Kiinteisto_modal.
	 * Käytetään modaalin sulkemispainikkeen id tietona
	 */
    return function(modalNameId) {
    	var modalPrefix;

    	if(modalNameId != undefined){
            var i = modalNameId.indexOf(':');
            modalPrefix = modalNameId.substring(0, i);

            // Poistetaan ääkköset
            modalPrefix = modalPrefix.replace(/ä/g, 'a').replace(/ö/g, 'o');

            modalPrefix = modalPrefix + '_modal';
    	}

        return modalPrefix;
    }
}]).filter('mipMapLayerName', [function() {
    /*
     * Poistetaan ikkunavalikon modalNameId tunnisteiden yksilöivä osa näytöltä
     */
    return function(layerName) {
        if(layerName.indexOf('POHJAKARTTA_') > -1) {
            //Otetaan sana POHJAKARTTA_ pois
            layerName = layerName.split('POHJAKARTTA_')[1];
        }
        return layerName;
    }
}]).filter('mipEpsg4326ToEpsg3067', ['MapService', function(MapService) {

    return function(coords) {
        var coord1, coord2, convertedCoords;
        coord1 = coords[0];
        coord2 = coords[1];

        convertedCoords = MapService.epsg4326ToEpsg3067(coord1, coord2);
        var lon = convertedCoords[1]+"";
        var lat = convertedCoords[0]+"";


        return "P: " + lon.split('.')[0] + " I:" + lat.split('.')[0];
    }
}]).filter('propInArray',function(){
    return function(items, propname, values) {
        var out = [];
        if (angular.isArray(items) && angular.isArray(values)) {
            items.forEach(function(item) {
            	for (var i=0; i<values.length; i++) {
            		if (values[i] == item[propname]) {
            			out.push(item);
            			break;
            		}
            	}
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
}).filter('unique', function () {
    /**
     * /**
     * Filters out all duplicate items from an array by checking the specified key
     * @param [key] {string} the name of the attribute of each object to compare for uniqueness
     if the key is empty, the entire object will be compared
     if the key === false then no filtering will be performed
     * @return {array}
     *
     * Puukotettu siten, että kaksi propertyä voi antaa , eroteltuna
     * eli jos halutaan että itemit pitää olla uniikkeja nimi ja numero kentistä, annetaan arvot näin: arvo1,arvo2
     * esim ng-repeat="rak_osoite in kiinteisto.properties.rakennus_osoitteet | unique: 'katunimi,katunumero'"
     */

    return function (items, filterOn) {

      if (filterOn === false) {
        return items;
      }

      if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
        var hashCheck = {}, newItems = [];

        var extractValueToCompare = function (item) {
          if (angular.isObject(item) && angular.isString(filterOn)) {

              if(filterOn.indexOf(',') > -1) {
                  //Multiple properties
                  var splittedFilter = filterOn.split(',');
                  var itemValues = [];
                  itemValues.push(item[splittedFilter[0]]);
                  itemValues.push(item[splittedFilter[1]]);

                  return itemValues;
              }

            return item[filterOn];
          } else {
            return item;
          }
        };

        angular.forEach(items, function (item) {
          var valueToCheck, isDuplicate = false;

          for (var i = 0; i < newItems.length; i++) {
              var newItemValues = extractValueToCompare(newItems[i]);
              var itemValues  = extractValueToCompare(item);
              if(angular.isArray(newItemValues)) {
                  if(angular.equals(newItemValues[0], itemValues[0]) && angular.equals(newItemValues[1], itemValues[1])) {
                      isDuplicate = true;
                      break;
                  }
              } else {
                  if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                      isDuplicate = true;
                      break;
                  }
              }
          }
          if (!isDuplicate) {
            newItems.push(item);
          }

        });
        items = newItems;
      }
      return items;
    };
  });
