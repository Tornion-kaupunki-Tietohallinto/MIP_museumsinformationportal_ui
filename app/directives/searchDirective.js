angular.module('mip.directives').factory('SearchService', [function() {

    var props = {

    };

    return {
        getProp : function(prop) {
            return props[prop];
        },
        setProp : function(prop, value) {
            props[prop] = value;
        },
        clearProp : function(prop) {
            delete props[prop];
        },
        getProps : function() {
            return props;
        }
    }
}]).directive('searchProp', ['SearchService','NgTableParams', function(SearchService, NgTableParams) {
	function link() {
		console.log("Existing props:");
        console.log(SearchService.getProps());

        scope.propname = scope.propname || attrs.name;

        if(SearchService.getProp(scope.propname)) {



//            SearchService.getProp(scope.propname));
            //scope.$parent.kiinteistotTable.filter( SearchService.getProps());

        }

        scope.$watch(scope.searchProp, function(value) {
            if(value) {
                SearchService.setProp(scope.propname, value);
            } else {
                SearchService.clearProp(scope.propname);
            }
        });
	}
    return {
        restrict: 'A',
         scope: {
            propname: '@',
            searchProp: '='
        },
        require: '?ngModel',
        link: link
    };
}]);