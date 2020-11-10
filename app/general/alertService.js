/*
 * Service for showing alerts
 */
angular.module('mip.alert', []);

angular.module('mip.alert').factory('AlertService', [
		'$alert', 'locale', function($alert, locale) {
			return {
				showInfo : function(title, content) {
					$alert({
						title : title,
						content : content,
						placement : 'floater top center',
						type : 'info',
						show : true,
						duration : 5

					});
				},
				showError : function(title, content) {
					$alert({
						title : title,
						content : content,
						placement : 'floater top center',
						type : 'danger',
						show : true,
						duration : 5
					});
				},
				showWarning : function(title, content, props = {duration: 5, dismissable: false}) {
					$alert({
						title : title,
						content : content,
						placement : 'floater top center',
						type : 'warning',
						show : true,
						duration : props.duration,
						dismissable: props.dismissable
					});
				},
				message : function(data) {
				    var msg = "";
				    var ret = "";

					if (data && data.data && data.data.response && data.data.response.message) {
						msg = data.data.response.message;
					} else if(data && data.response && data.response.message) {
					    msg = data.response.message;
					}

                    for (var i = 0; i < msg.length; i++) {
                        ret += msg[i] + "<br>";
                    }

                    if(ret.length > 0) {
                        return ret;
                    } else {
                        return locale.getString('common.Unknown_error');
                    }
				}
			}
		}
]);