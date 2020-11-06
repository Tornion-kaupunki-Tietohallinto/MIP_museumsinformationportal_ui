/**
 * Näytteen sijaintitiedoston lisäysControllers
 *
 */
angular.module('mip.file').controller(
    'LisaaSijaintiTiedostoController',
    [
            '$scope', '$rootScope', 'CONFIG', '$http', 'ModalService', 'AlertService', '$timeout', 'FileService',
            'Upload', 'UserService', 'locale', '$window', 'selectedModalNameId',
            'ModalControllerService', "entityType", "tutkimus",
            function($scope, $rootScope, CONFIG, $http, ModalService, AlertService, $timeout, FileService,
                    Upload, UserService, locale, $window, selectedModalNameId,
                    ModalControllerService, entityType, tutkimus) {

                var vm = this;

                /**
                 * Controllerin set-up. Suoritetaan ainoastaan kerran.
                 */
                vm.setUp = function() {
                    angular.extend(vm, ModalControllerService);

                    // Valitun modalin nimi ja järjestysnumero
                    vm.modalNameId = selectedModalNameId;

                    vm.tutkimus = tutkimus;
                    //Jos alla oleva on annettu, asetetaan sijaintia yhdelle tutkimusalueelle. Muulloin sijainteja luetaan tiedostosta ja lisätään uusia tutkimusalueita.
                    //vm.tutkimusalue = tutkimusalue;
                    vm.status = locale.getString('ark.Select_coordinates_files_info');
                    vm.statusCode ="alert-info";
                };
                vm.setUp();

                vm.canStartUpload = false;

                // The files that will be uploaded
                vm.files = [];

                // Max image size
                vm.MAX_FILE_SIZE = CONFIG.MAX_FILE_SIZE;

                /*
                 * ------------------- OPERATIONS ------------------------
                 */

                /*
                 * Will be done automatically after the OS explorer has been closed.
                 */

                 vm.selectFiles = function(files, errFiles) {

                    // Update the file properties if the values are empty
                    for (var i = 0; i < files.length; i++) {
                        //files[i].properties = {};
                        files[i].status = "loading";
                    }

                    var fileLength = vm.files.length;
                    for (var i = 0; i < files.length; i++) {
                        vm.files.push(files[i]);
                    }

                    for (var i = 0; i < errFiles.length; i++) {
                        vm.errFiles.push(errFiles[i]);
                    }

                    vm.verifyFiles();
                };

                vm.verifyFiles = function() {
                    if(vm.files.length < 1) {
                        vm.status = locale.getString('ark.Select_files_info');
                        vm.statusCode = 'alert-info';
                        return;
                    }

                    if(vm.files.length > 1) {
                        vm.status = locale.getString("ark.Too_many_files_selected");
                        vm.statusCode = 'alert-danger';
                        return;
                    }

                    //Jos listassa on 1 tiedosto, se ei saa olla dbf, shp tai shx
                    if(vm.files.length === 1) {
                        var file = vm.files[0];
                        var extension = vm.getExtension(file.name);

                        if(extension === 'dbf' || extension === 'shp' || extension === 'shx') {
                            vm.status = locale.getString('ark.Shapefile_select_missing_files');
                            vm.statucCode = 'warning';
                            return;
                        }
                        //Valitut tiedostot eivät sisällä Shapefileen kuuluvia tiedostoja. Tarkastetaan onko valitut tiedostot
                        //sallittuja ja edetään jos ovat.
                       //TODO: Lisää muut sallitut muodot
                        if(extension === 'gpx' || extension === 'csv' || extension === 'mif' || extension == 'dxf') {
                            vm.status = locale.getString('ark.Uploading_can_begin');
                            vm.statusCode = 'alert-success';
                            vm.canStartUpload = true;
                        } else {
                            vm.status = locale.getString('ark.Invalid_file_type');
                            vm.statusCode= 'alert-danger';
                        }
                    }

                    //Jos listassa on enemmän kuin 1 tiedosto, se ei saa olla muu kuin dbf, shp tai shx
                    if(vm.files.length === 2) {
                        var file1 = vm.files[0];
                        var file2 = vm.files[1];

                        var extension1 = vm.getExtension(file1.name);
                        var extension2 = vm.getExtension(file2.name);
                        if(extension1 === 'dbf' || extension1 === 'shp' || extension1 === 'shx' || extension2 === 'dbf' || extension2 === 'shp' || extension2 === 'shx') {
                            vm.status = locale.getString('ark.Shapefile_select_missing_files');
                            vm.statusCode = 'alert-warning';
                        } else {
                            vm.status = locale.getString('ark.Remove_extra_files');
                            vm.statusCode = 'alert-warning';
                        }
                    }

                    //Jos listassa on dbf, shp tai shx + prj, tiedostoja pitää olla kolme ja nuo päätteet
                    if(vm.files.length === 3) {
                        var file1 = vm.files[0];
                        var file2 = vm.files[1];
                        var file3 = vm.files[2];

                        var extension1 = vm.getExtension(file1.name);
                        var extension2 = vm.getExtension(file2.name);
                        var extension3 = vm.getExtension(file3.name);

                        var extensions = [extension1, extension2, extension3];
                        if(extensions.indexOf('dbf') > -1 && extensions.indexOf('shp') > -1 && extensions.indexOf('shx') > -1) {
                            vm.status = locale.getString('ark.Uploading_can_begin');
                            vm.statusCode = 'alert-success';
                            vm.canStartUpload = true;
                        } else {
                            vm.status = locale.getString('ark.Shapefile_select_missing_files');
                            vm.statusCode = 'alert-warning';

                        }
                    }
                };

                vm.getExtension = function(filename) {
                    var p = filename.split('.');
                    if(p.length != 2) {
                        return null;
                    }

                    return p[1];
                }

                vm.upload = function() {
                    if(vm.files.length === 0) {
                        return;
                    }
                    if(vm.files.length === 1) {
                        FileService.saveArkFile(vm.files[0], {}, CONFIG.ENTITY_TYPE_IDS[entityType], vm.tutkimus.properties.id, 'lisaa_koordinaatit').then(function success(response) {
                            var data = [];
                            for(var i = 0; i<vm.files.length; i++) {
                                if(vm.files[i].result) {
                                    data = data.concat(vm.files[i].result);
                                }
                            }

                            vm.close();
                            $scope.$destroy();

                            vm.status = locale.getString('ark.Coordinates_loaded_succesfully');
                            vm.statusCode = 'alert-success';
                            if (data[0].rowsUpdated == data[0].geometry.length){
                                AlertService.showInfo(locale.getString('ark.Coordinates_updated'),
                                "<br>" +locale.getString('ark.Rows_updated') +data[0].rowsUpdated +"/" +data[0].geometry.length);
                            }
                            else{
                                AlertService.showWarning(locale.getString('ark.Coordinates_updated'),
                                "<br>" +locale.getString('ark.Rows_updated') +data[0].rowsUpdated +"/" +data[0].geometry.length
                                +"<br>" +locale.getString('ark.Rows_not_updated')
                                +"<br>" +data[0].rowsNotFound.join("<br>"),
                                {duration: false, dismissable: true});
                            }

                        }, function error(response) {
                            // Näytetään bäkkärin virhe käyttäjälle
                            vm.disableButtonsFunc(false);
                            vm.status = locale.getString("ark.Error_uploading") + AlertService.message(response);
                            vm.statusCode = 'alert-danger';
                        });
                    } /*else { //Shapefilen lukeminen ei toimi vielä oikein
                        FileService.saveArkFile(vm.files, {}, CONFIG.ENTITY_TYPE_IDS[entityType], vm.tutkimus.properties.id, 'lisaa_koordinaatit').then(function success(response) {
                            var data = response;
                            vm.status = locale.getString('ark.Coordinates_loaded_succesfully');
                            vm.statusCode = 'alert-success';
                            //console.log(data);
                            //ModalService.lisaaTutkimusalueModal(vm.tutkimus, parentModalId, data, vm.tutkimusalue);
                            vm.close();
                            $scope.$destroy();
                            //AlertService.showInfo(locale.getString('common.Error'), AlertService.message("Päivitettiin " +data.length +" riviä"));
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                            vm.disableButtonsFunc(false);
                            vm.status = locale.getString("ark.Error_uploading");
                            vm.statusCode = 'alert-danger';
                        });
                    }*/
                };

                /*
                 * Close
                 */
                $scope.close = function() {
                    // Sulkee modaalin ja poistaa listalta
                    ModalService.closeModal(vm.modalNameId);
                    $scope.$destroy();
                };

                /*
                 * Remove image from the upload / errorFiles list
                 */
                vm.remove = function(index, errFiles) {
                    if (errFiles == true) {
                        vm.errFiles.splice(index, 1);
                    } else {
                        vm.files.splice(index, 1);
                    }
                    vm.verifyFiles();
                };

                /*
                 * --------------------- HELPER FUNCTIONS ----------------------
                 */

             // Enable / Disable save and cancel buttons while doing operations.
                vm.disableButtonsFunc = function(value) {
                    if (value != null) {

                        vm.disableButtons = value;
                    } else {
                        if (vm.disableButtons) {
                            vm.disableButtons = false;
                        } else {
                            vm.disableButtons = true;
                        }
                    }
                };
            }
    ]);