angular.module('mip.directives').directive('mipKarttaselain', [function() {
    function link(scope, element, attrs) {

        scope.currentKarttaIndex = function() {
            for(var i = 0; i<scope.list.length; i++) {
                if(scope.kartta.properties.id == scope.list[i].properties.id) {
                    return i+1;
                }
            }
        };

        scope.changeKartta = function(next) {
            if(next == true) {
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.list[i].properties.id == scope.kartta.properties.id) {
                        if(i+1 <= scope.list.length-1) {
                            scope.kartta = scope.list[i+1];
                            scope.original = angular.copy(scope.kartta);
                            break;
                        }
                    }
                }
            } else {
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.list[i].properties.id == scope.kartta.properties.id) {
                        if(i > 0) {
                            scope.kartta = scope.list[i-1];
                            scope.original = angular.copy(scope.kartta);
                            break;
                        }
                    }
                }
            }
        };

        scope.isFirst = function() {
            if(scope.kartta.properties.id == scope.list[0].properties.id) {
                return true;
            } else {
                return false;
            }
        };

        scope.isLast = function() {
            if(scope.kartta.properties.id == scope.list[scope.list.length-1].properties.id) {
                return true;
            } else {
                return false;
            }
        };
    }
    return {
        link: link,
        template: '<button type="button" class="btn btn-default" ng-click="changeKartta(false)" ng-disabled="isFirst()"><i class="fa fa-arrow-left" aria-hidden="true"></i></button> {{currentKarttaIndex()}} / {{list.length}} <button type="button" class="btn btn-default" ng-click="changeKartta(true)" ng-disabled="isLast()"><i class="fa fa-arrow-right" aria-hidden="true"></i></button>'

    };
}]);