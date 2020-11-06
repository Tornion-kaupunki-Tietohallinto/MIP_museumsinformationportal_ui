angular.module('mip.directives').directive('mipKuvaselain', [function() {
    function link(scope, element, attrs) {

        scope.currentImageIndex = function() {
            for(var i = 0; i<scope.list.length; i++) {
                if(scope.image.properties.id == scope.list[i].properties.id) {
                    return i+1;
                }
            }
        };

        scope.changeImage = function(next) {
            if(next == true) {
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.list[i].properties.id == scope.image.properties.id) {
                        if(i+1 <= scope.list.length-1) {
                            scope.image = scope.list[i+1];
                            scope.original = angular.copy(scope.image);
                            break;
                        }
                    }
                }
            } else {
                for(var i = 0; i<scope.list.length; i++) {
                    if(scope.list[i].properties.id == scope.image.properties.id) {
                        if(i > 0) {
                            scope.image = scope.list[i-1];
                            scope.original = angular.copy(scope.image);
                            break;
                        }
                    }
                }
            }

            //Jos ollaan ark-puolella, asiasanojen rakennetta pitää hieman korjata kuvan vaihdon yhteydessä
            if(typeof(scope.fixAsiasanat) ==='function') {
            	scope.fixAsiasanat();
            }
        };

        scope.isFirst = function() {
            if(scope.image.properties.id == scope.list[0].properties.id) {
                return true;
            } else {
                return false;
            }
        };

        scope.isLast = function() {
            if(scope.image.properties.id == scope.list[scope.list.length-1].properties.id) {
                return true;
            } else {
                return false;
            }
        };
    }
    return {
        link: link,
        template: '<button type="button" class="btn btn-default" ng-click="changeImage(false)" ng-disabled="isFirst()"><i class="fa fa-arrow-left" aria-hidden="true"></i></button> {{currentImageIndex()}} / {{list.length}} <button type="button" class="btn btn-default" ng-click="changeImage(true)" ng-disabled="isLast()"><i class="fa fa-arrow-right" aria-hidden="true"></i></button>'

    };
}]);