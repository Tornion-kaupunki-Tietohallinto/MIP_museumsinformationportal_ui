/* Directives */
var INTEGER_REGEXP = /^-?\d+$/;
var POSITIVE_INTEGER_REGEXP = /^\d+$/;
var ONEDECIMAL_REGEXP = /^(\d+)?([.]|[,]?\d{0,1})?$/;
angular.module('mip.directives', []).directive('pwCheck', [
    function() {
        return {
            require : 'ngModel',
            link : function(scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.pwCheck;

                elem.on('keyup blur', function() {
                    scope.$apply(function() {
                        ctrl.$setValidity('pwmatch', elem.val() === $(firstPassword).val());
                    });
                });
            }
        }
    }
]).directive('pwValid', [
    function() {
        return {
            require : 'ngModel',
            link : function(scope, elem, attrs, ctrl) {
                var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[a-zA-Z\d!$#%]+$/;

                elem.on('keyup blur', function() {
                    scope.$apply(function() {
                        if (elem.val().length > 0) {
                            ctrl.$setValidity('pwvalid', pattern.test(elem.val()) && elem.val().length >= 6);
                        } else {
                            ctrl.$setValidity('pwvalid', true);
                        }
                    });
                });
            }
        }
    }
]).directive('integer', [function() {
    /* custom integer validator */
    return {
        require : 'ngModel',
        link : function(scope, elm, attrs, ctrl) {
            ctrl.$validators.integer = function(modelValue, viewValue) {
                if (!ctrl.$touched) {
                    // check only when modified (touched)
                    return true;
                }
                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty models to be valid
                    return true;
                }
                if (INTEGER_REGEXP.test(viewValue)) {
                    // it is valid
                    return true;
                }
                // non-valid
                return false;
            };
        }
    };
}]).directive('positiveinteger', [function() {
    /* custom integer validator, only positive integers accepted */
    return {
        require : 'ngModel',
        link : function(scope, elm, attrs, ctrl) {
            ctrl.$validators.integer = function(modelValue, viewValue) {
                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty models to be valid
                    return true;
                }
                if (POSITIVE_INTEGER_REGEXP.test(viewValue)) {
                    // it is valid
                    return true;
                }
                // non-valid
                return false;
            };
        }
    };
}]).directive('onedecimal', [function() {
    /* custom onedecimal validator */
    return {
        require : 'ngModel',
        link : function(scope, elm, attrs, ctrl) {
            ctrl.$validators.onedecimal = function(modelValue, viewValue) {
                if (!ctrl.$touched) {
                    // check only when modified (touched)
                    return true;
                }
                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty models to be valid
                    return true;
                }
                if (ONEDECIMAL_REGEXP.test(viewValue)) {
                    // it is valid
                    return true;
                }
                // it is invalid
                return false;
            };
        }
    };
}]).directive('imageonload', [function() {
    /* Method that is called when image is loaded */
    return {
        restrict : 'A',
        link : function(scope, element, attrs) {
            element.bind('load', function() {
                scope.$apply(attrs.imageonload, true);
            });
            element.bind('error', function() {
                // alert('image could not be loaded');
                scope.$apply(attrs.imageonload, false);
            });
        }
    };
}]).directive('highlighter', [
    /*
     * Apply a temporary highlight to field when the value changes if the field is not the selected one.
     * usage: <input name="name" ng-model="person.name" data-highlighter="person.name">
     */
        '$timeout', function($timeout) {
            return {
                restrict : 'A',
                scope : {
                    model : '=highlighter'
                },
                link : function(scope, element) {
                    scope.$watch('model', function(nv, ov) {
                        var el = angular.element(document.activeElement);
                        if (el[0].name != element[0].name) {
                            if (nv !== ov) {
                                // apply class
                                element.addClass('highlight');
                                // auto remove after some delay
                                $timeout(function() {
                                    element.removeClass('highlight');
                                }, 1000);
                            }
                        }
                    });
                }
            };
        }
]).directive('emptyToNull', [function () {
    /*
     * Convert empty value to null. Useful in integer fields as emptying the value
     * results in to "" instead of null and "" is not a valid integer in db.
     */
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            ctrl.$parsers.push(function(viewValue) {
                if(viewValue === "") {
                    return null;
                }
                return viewValue;
            });
        }
    };
}]).directive('tempReadonly', ['$timeout', '$interval', function($timeout, $interval) {
    /*
     * Directive for removing attribute readonly from the element after 500 milliseconds delay.
     * Usage: Add temp-readonly and readonly attributes to the element (e.g. <input type="text" temp-readonly readonly>...
     * Related CSS to make the field not appear as readonly for the first 500ms is class temporaryReadonly found in the style.css (input[readonly].temporaryReadonly { background-color: #fff; })
     */

    function link(scope, element, attrs) {
        var timeoutId;

        //Remove the readonly value
        function updateReadonly() {
            if (attrs.hasOwnProperty('readonly')) {
                element.removeAttr('readonly');
            }
        }

        //Cancel the timeout on the modal close
        element.on('$destroy', function() {
            $interval.cancel(timeoutId);
        });

        //Start the UI update process; save the timeoutId for canceling
        timeoutId = $interval(function() {
          updateReadonly(); // update DOM
        }, 500);

    }

    return {
        link: link
    };
}]).directive('textarea', [function() {
    /*
     * TextArea-kentän kasvatus rivien mukaan
     * Tämä ohittaa priority arvollaan Angularin direktiivin "textarea"
     */
	  return function(scope, element, attr){
	      var update = function(){
	    	  priority: 100,
	          element.css("height", "auto");
	          element.css("height", element[0].scrollHeight + "px");
	      };
	      scope.$watch(attr.ngModel, function(){
	          update();
	      });
	      attr.$set("ngTrim", "false");
	  };
}]).directive('focusMe', ['$timeout', function($timeout) {
	/*
	 * Direktiivi jolla pystytään asettamaan focus tiettyyn kontrolliin esimerkiksi koodissa suoritettavan funktion yhteydessä
	 * (=editmoodiin mentäessä fokusoidaan formin ensimmäiseen kontrolliin)
	 * Käyttö:
	 * 1: html-elementissä määritä focus-me="focusInput"
	 * 2: kontrollerin alussa: $scope.focusInput = false;
	 * 3: editmoodifunktiossa: $scope.focusInput = true;
	 *
	 * Huom: Direktiivit ja UI-select vaativat hieman lisätyötä, toimivat esimerkit toteutettu
	 * ensisijainen_materiaali direktiivissä ja tutkimuslaji_direktiivissä
	 */
	  return {
		  link: function(scope, element, attrs) {
		      scope.$watch(attrs.focusMe, function(value) {
		          if(value === true) {
		              $timeout(function() {
		            	  element[0].focus();
		            	  scope[attrs.focusMe] = false;
		              });
		          }
		      });
		  }
	  };
}]).directive('kuvia', [function () {
    /*
     * Näyttää controllerissa asetetun kuvien lukumäärän suluissa.
     */
    return {
        template: '({{kuvia_kpl}})'
    };
}]).directive('lukumaara', [function () {
    /*
     * Näyttää controllerissa asetetun tietojen lukumäärän suluissa.
     */
    return {
    	scope: {
    		kplMaara: '=arvo'
    	},
        template: '({{kplMaara}})'
    };
}]);