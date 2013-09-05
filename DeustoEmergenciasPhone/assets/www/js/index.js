
document.addEventListener("pause", onPause, false);

var pushNotification;

var serversArray = [];

var selectedServer;

var serverMode;

var selectedIncident;

var incidentMode;

var lang;

var settings;

var db;

var refresh = false;

var incident;

var police = 'tel:+34 679 956 731';
var fire = 'tel:+34 679 956 731';
var emergencies = 'tel:+34 679 956 731';

function DOMLoaded(){
	console.log('DOMLoaded');
	document.addEventListener("deviceready", phonegapLoaded, false);
	navigator.geolocation.getCurrentPosition(onSuccessMap, onError);
}

function phonegapLoaded(){
	console.log('phonegapLoaded');
	init_db();
}
//INICIO FUNCIONES i18n
function multiLanguage(){
	console.log('multiLanguage');
	jQuery.i18n.properties({
	    name:'Messages',
	    path:'bundle/',
	    mode:'both', 
	    language: lang, 
	    callback: function() {
	    	//Menu literals
	    	menuLeft();
	    	i18nIndex();
	    	i18nServers();
	    	i18nIncidents();
	    }
	});
}

function menuLeft(){
	$('.menuLeftClose').text(""+jQuery.i18n.prop('msg_menuClose'));
	$('.menuLeftHome').text(""+jQuery.i18n.prop('msg_home'));
	$('.menuLeftServers').text(""+jQuery.i18n.prop('msg_servers'));
	$('.menuLeftReports').text(""+jQuery.i18n.prop('msg_reports'));
	$('.menuLeftMapView').text(""+jQuery.i18n.prop('msg_mapReport'));
	$('.menuLeftSettings').text(""+jQuery.i18n.prop('msg_settings'));
	$('.menuLeftAbout').text(""+jQuery.i18n.prop('msg_about'));
}

function i18nIndex(){
	$('#telefonos').text(""+jQuery.i18n.prop('msg_phones'));
}

function i18nServers(){
	$('label[for="serverName"]').text(""+jQuery.i18n.prop('msg_name'));
	$('label[for="serverDescription"]').text(""+jQuery.i18n.prop('msg_description'));
	$('label[for="serverUrl"]').text(""+jQuery.i18n.prop('msg_url'));
	$('#cancel').text(""+jQuery.i18n.prop('msg_cancel'));
	$('#saveServer').text(""+jQuery.i18n.prop('msg_save'));
}

function i18nIncidents(){
	$('#headerSubmitReport').text(""+jQuery.i18n.prop('msg_save'));
	$('label[for="incidentTitle"]').text(""+jQuery.i18n.prop('msg_title'));
	$('label[for="incidentDescription"]').text(""+jQuery.i18n.prop('msg_description'));
	$('label[for="incidentDate"]').text(""+jQuery.i18n.prop('msg_date'));
	$('label[for="incidentTime"]').text(""+jQuery.i18n.prop('msg_time'));
	$('label[for="incidentCategory"]').text(""+jQuery.i18n.prop('msg_category'));
	$('label[for="incidentLocation"]').text(""+jQuery.i18n.prop('msg_location'));
	$('#incidentComments').text(""+jQuery.i18n.prop('msg_comments'));
	$('#headerAddComent').text(""+jQuery.i18n.prop('msg_comment'));
	$('#headerSaveComent').text(""+jQuery.i18n.prop('msg_save'));
	$('label[for="commentAuthor"]').text(""+jQuery.i18n.prop('msg_author'));
	$('label[for="commentEmail"]').text(""+jQuery.i18n.prop('msg_email'));
	$('label[for="commentDescription"]').text(""+jQuery.i18n.prop('msg_description'));
}

//FIN FUNCIONES i18n

//INICIO FUNCIONES NAVEGACION

$( document ).on("pageshow", "#serversPage",function(){
	$('#serverList').empty();
	showServers();
});

$( document ).on("pagebeforeshow",  "#reportsPage",function(){
	$('#incidentList').empty();
});

$( document ).on("pageshow",  "#reportsPage",function(){
	$('#incidentList').empty();
	showIncidents();
});

$( document ).on("pagebeforeshow",  "#serverFormPage",function(){
	if(serverMode == 'edit'){
		$('#headerDeleteServer').show();
		loadServerEditForm();
	}
	else{
		$('#headerDeleteServer').hide();
		loadServerAddForm();
	}
});

$( document ).on("pageshow",  "#incidentPage",function(){
	if(incidentMode == 'edit'){
		$('#listCommentsLink').show();
		$('#headerSubmitReport').hide();
		loadIncidentEditForm();
	}
	else{
		$('#listCommentsLink').hide();
		$('#headerSubmitReport').show();
		loadIncidentAddForm();
	}
});

$( document ).on("click", "#headerAddServer", function(){
	selectedServer = null;
	serverMode = 'add';
	$.mobile.changePage("#serverFormPage", {
		transition: "slidefade"
	});
});

function goToServerForm(event){
	console.log("serverForm");
	selectedServer = event.target.id;
	serverMode = 'edit';
	$.mobile.changePage("#serverFormPage", {
		transition: "slidefade"
	});
}

$( document ).on("click", "#headerAddIncident", function(){
	incidentMode = 'add';
	$.mobile.changePage("#incidentPage", {
		transition: "slidefade"
	});
});

function goToIncidentForm(event){
	console.log("incidentForm");
	incidentMode = 'edit';
	$.mobile.changePage("#incidentPage", {
		transition: "slidefade"
	});
}

$( document ).on("click", "#cancel", function(){
	$.mobile.back();
});

$( document ).on("click", "#incidentComments", function(){
	console.log('incidentComment');
	$.mobile.changePage("#commentsPage", {
		transition: "slidefade"
	});
});

$( document ).on("pagebeforeshow", "#settingsPage",function(){
	$('#language').val(settings.language);
	$('#notifications').val(settings.notifications);
	$('#userName').val(settings.userName);
	$('#userSurname').val(settings.userSurname);
	$('#radioAviso').val(settings.radio);
//	$('#listSettings').listview('refresh');
});

$( document ).on("pagebeforeshow", "#commentsPage",function(){
	$('#commentsList').empty();
	getComments();
});

$( document ).on("pagebeforeshow", "#commentFormPage",function(){
	$('#commentAuthor').val(settings.userName+" "+settings.userSurname);
	$('#commentEmail').val("");
	$('#commentDescription').val("");
});

$(document).on("pageshow", "#mapReportsPage", function(){
	navigator.geolocation.getCurrentPosition(loadReportMap,onError);
});
//FIN FUNCIONES NAVEGACION

// INICIO FUNCIONES BBDD

function init_db(){
	console.log('init_db');
	db = window.openDatabase('DeustoEmer', '1.0', 'Deusto Emergencias', '10000000');
	db.transaction(populateDB, errorCB, getServersDB);
	db.transaction(populateDB, errorCB, getSettingsDB);
}

function populateDB(tx) {
	console.log('populateDB');
	tx.executeSql('DROP TABLE IF EXISTS SERVERS');
	tx.executeSql('DROP TABLE IF EXISTS SETTINGS');
	tx.executeSql('CREATE TABLE IF NOT EXISTS SERVERS (id INTEGER PRIMARY KEY, name, description, url)');
    tx.executeSql('INSERT INTO SERVERS (id, name, description, url) VALUES (1, "Deusto emergencias", "Deusto emergencias", "http://deustoemer.hol.es/ushahidi")');
    tx.executeSql('CREATE TABLE IF NOT EXISTS SETTINGS (id INTEGER PRIMARY KEY, language, notifications, userName, userSurname, radio INTEGER)');
}

function errorCB(err) {
	 console.log("Error processing SQL: "+err.code);
}

function getServersDB(){
	db = window.openDatabase('DeustoEmer', '1.0', 'Deusto Emergencias', '10000000');
    db.transaction(function queryDB(tx) {
        tx.executeSql('SELECT * FROM SERVERS', [], getServersSuccess, errorCB);
    }, errorCB);
}

//Query the success callback
function getServersSuccess(tx, results) {
    var len = results.rows.length;
    console.log("SERVERS table: " + len + " rows found.");
    serversArray = [];
    for (var i=0; i<len; i++){
        console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Name =  " + results.rows.item(i).name
        		+ " Description = "+ results.rows.item(i).description + " URL = "+results.rows.item(i).url);
        console.log("ITEM: "+results.rows.item(i));
        serversArray[i] = { id: results.rows.item(i).id,
        		name: results.rows.item(i).name,
        		description: results.rows.item(i).description,
        		url: results.rows.item(i).url};
    }
}

function getSettingsDB(){
	db.transaction(function queryDB(tx) {
        tx.executeSql('SELECT * FROM SETTINGS', [], function getSettingsSucces(tx, results){
        	var len = results.rows.length;
            console.log("settings: " + len + " rows found.");
            for (var i=0; i<len; i++){
                console.log("Language = "+i+" ID = "+results.rows.item(i).language +" Notifications =  "+results.rows.item(i).notifications+" UserName =  " + results.rows.item(i).userName
                		+ " UserSurname = "+ results.rows.item(i).userSurname + " Radio = "+results.rows.item(i).radio);
                console.log("ITEM: "+results.rows.item(i));
            }
            if(len>0){
            	settings = {id: results.rows.item(0).id, language: results.rows.item(0).language, 
            			notifications: results.rows.item(0).notifications, userName: results.rows.item(0).userName, 
            			userSurname: results.rows.item(0).userSurname, radio: results.rows.item(0).radio};
            	lang = settings.language;
            	multiLanguage();
            	if(settings.notifications == 'on'){
            		init_notifications();
            	}
            } else{
            	if ( navigator && navigator.userAgent && (lang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
        		    lang = lang[1];
        		}
        		if (!lang && navigator) {
        		    if (navigator.language) {
        		            lang = navigator.language;
        		    } else if (navigator.browserLanguage) {
        		            lang = navigator.browserLanguage;
        		    } else if (navigator.systemLanguage) {
        		            lang = navigator.systemLanguage;
        		    } else if (navigator.userLanguage) {
        		            lang = navigator.userLanguage;
        		    }
        		    lang = lang.substr(0, 2);
        		}
            	insertDefaultSettings();
            }
        }, errorCB);
	}, errorCB);
}

function insertDefaultSettings(){
	db.transaction(function queryDB(tx) {
		tx.executeSql("INSERT into SETTINGS (id, language, notifications, userName, userSurname, radio)"
				+" values (1, '"+lang+"', 'on', '', '', 10)", [], getSettingsDB, errorCB);
	}, errorCB);
}

//FIN FUNCIONES BBDD

//INICIO FUNCIONES NOTIFICACIONES GCM Y APN

function init_notifications(){
	try{
    	pushNotification = window.plugins.pushNotification;
    	if (device.platform == 'android' || device.platform == 'Android') {
        	pushNotification.register(successHandler, errorHandler, {"senderID":"831024351421","ecb":"onNotificationGCM"});		// required!
		} else {
        	pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	// required!
    	}
    }
	catch(err){
		txt="There was an error on this page.\n\n"; 
		txt+="Error description: " + err.message + "\n\n"; 
		alert(txt); 
	}
}

function successHandler (result) {
	console.log("success");
}

function errorHandler (error) {
	console.log("error");
}

// iOS
function onNotificationAPN(event) {
    var pushNotification = window.plugins.pushNotification;
    console.log("Received a notification! " + event.alert);
    console.log("event sound " + event.sound);
    console.log("event badge " + event.badge);
    console.log("event " + event);
    if (event.alert) {
        navigator.notification.alert(event.alert);
    }
    if (event.badge) {
        console.log("Set badge on  " + pushNotification);
        pushNotification.setApplicationIconBadgeNumber(this.successHandler, event.badge);
    }
    if (event.sound) {
        var snd = new Media(event.sound);
        snd.play();
    }
}

// handle GCM notifications for Android
function onNotificationGCM(e) {
	$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');
	console.log(e.event);
	switch( e.event ){
		case 'registered':
			if ( e.regid.length > 0 ){
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				var request = new XMLHttpRequest();
				request.open("GET", "http://deustoemer.hol.es/ushahidi/push/storeUser/"+e.regid+"/android", true);
				request.onreadystatechange = function(){
					if (request.readyState == 4) {
						if (request.status == 200 || request.status == 0) {
							console.log(request.response);
						}
					}
				}
				request.send();
			}
		break;
            
		case 'message':
        	// if this flag is set, this notification happened while we were in the foreground.
        	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
			alert(e.payload.title+' - >'+e.payload.description);
        break;
        
		case 'error':
			alert(e.msg);
        break;
        
        default:
			alert('Unknown, an event was received and we do not know what it is</li>');
        break;
	}
}

//INICIO FUNCIONES NOTIFICACIONES GCM Y APN

function onPause() {
    // Handle the pause event
}

//INICIO FUNCIONES GOOGLE MAPS

//Función utilizada para pintar el mapa de la página principal
function onSuccessMap(position) { 
    var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    map  = new google.maps.Map(document.getElementById('map_canvas'), {
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	center: myLocation,
	zoom: 15,
    });
    
    google.maps.event.trigger(map, 'resize');
    
    var currentPositionMarker = new google.maps.Marker({
    	position: myLocation,
    	map: map,
    	title: "Current position"
    });
    
    currentRadiusValue = 2000;
    var request = { location: myLocation, radius: currentRadiusValue, types: ['policia', 'hospital', 'bomberos'] }; 
    var service = new google.maps.places.PlacesService(map); 
    service.nearbySearch(request, callback);
}

function onError(error) {
    alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
}

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var place = results[i];
      createMarker(results[i]);
    }
  }
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
	map: map,
	position: place.geometry.location
    });
}

function loadReportMap(position){
	var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    map  = new google.maps.Map(document.getElementById('map_canvas_reports'), {
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	center: myLocation,
	zoom: 10,
    });
    
    google.maps.event.trigger(map, 'resize');
    for(var i=0; i<serversArray.length; i++){
	    $.ajax({
			type       : "GET",
			url        : serversArray[i].url+'/api?task=incidents',
			beforeSend : function() {$.mobile.loading('show')},
			complete   : function() {$.mobile.loading('hide')},
			data       : {},
			dataType   : 'json',
			async: true,
			success: function(response){
				try{
					if(response.error != null && response.error.code == '0'){
						var incidents = response.payload.incidents;
						for(j=0; j<incidents.length; j++){
							createIncidentMarker(incidents[j]['incident']);
						}
					}
				} catch(e){
					console.log(e);
				}
			},
			error: function(request,error){
				console.log(error);
			}
		});
    }
}

function createIncidentMarker(incident){
	var marker = new google.maps.Marker({
	    position: new google.maps.LatLng(incident.locationlatitude, incident.locationlongitude),
	    map: map
	});

	var infowindow = new google.maps.InfoWindow({
		content: 'Name<br />'+incident.incidenttitle+'<br />'
	});
	
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map, marker);
	});
}

//FIN FUNCIONES GOOGLE MAPS

//INICIO FUNCIONES PANTALLA PRINCIPAL

function callPolice(){
	if (device.platform == 'android' || device.platform == 'Android') {
		document.location.href = police;
	} else{
		window.plugins.phoneDialer.dial(police);
	}
}

function callFire(){
	if (device.platform == 'android' || device.platform == 'Android') {
		document.location.href = fire;
	} else{
		window.plugins.phoneDialer.dial(fire);
	}
}

function callEmergencies(){
	if (device.platform == 'android' || device.platform == 'Android') {
		document.location.href = emergencies;
	} else{
		window.plugins.phoneDialer.dial(emergencies);
	}
}

//FIN FUNCIONES PANTALLA PRINCIPAL


//INICIO FUNCIONES SERVIDORES

function showServers(){
	console.log("Servidores en show: "+serversArray.length);
	var len = serversArray.length;
	for (var i=0; i<len; i++){
		console.log("Servidor en show: "+serversArray[i]);
		console.log("Servidor en show id: "+serversArray[i].id);
		$('#serverList').append('<li><a href="#" id="'+serversArray[i].id+'">'+serversArray[i].name+'</a></li>');
		$('#'+serversArray[i].id).off('click').on('click', function(e){
			console.log("Click");
			goToServerForm(event);
		});
	}
	$('#serverList').listview('refresh');
	if(refresh){
		$.mobile.back();
		refresh = false;
	}
}

function loadServerEditForm(){
	console.log("loadServerEditForm");
	$('#serverId').val(selectedServer);
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			console.log("Encontrado servidor");
			$('#serverName').val(serversArray[i].name);
			$('#serverDescription').val(serversArray[i].description);
			$('#serverUrl').val(serversArray[i].url);
		}
	}
}

function loadServerAddForm(){
	selectedServer = 1;
	for(var i=0; i<serversArray.length; i++){
		if(serversArray[i].id > selectedServer){
			selectedServer = serversArray[i].id;
		}
	}
	selectedServer ++;
	$('#serverId').val(selectedServer);
    $('#serverName').val("");
	$('#serverDescription').val("");
	$('#serverUrl').val("");
}

$(document).on("click","#headerDeleteServer", function(){
	console.log("Delete server "+selectedServer);
	db.transaction(function queryDB(tx) {
        tx.executeSql('DELETE FROM SERVERS WHERE id='+selectedServer, [], okDeleteServer, errorServerDelete);
    }, errorServerDelete);
});

function okDeleteServer(){
	console.log("okDeleteServer");
	refresh=true;
	db.transaction(function queryDB(tx) {
        tx.executeSql('SELECT * FROM SERVERS', [], function success(tx, results){
        	var len = results.rows.length;
            console.log("SERVERS table: " + len + " rows found.");
            serversArray = [];
            for (var i=0; i<len; i++){
                console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Name =  " + results.rows.item(i).name
                		+ " Description = "+ results.rows.item(i).description + " URL = "+results.rows.item(i).url);
                console.log("ITEM: "+results.rows.item(i));
                serversArray[i] = { id: results.rows.item(i).id,
                		name: results.rows.item(i).name,
                		description: results.rows.item(i).description,
                		url: results.rows.item(i).url};
            }
            $('#serverList').empty();
        	showServers();
        }, errorServerDelete);
    }, errorServerDelete);
}

function errorServerDelete(err){
	alert("Error al borrar: "+err.code)
}

$(document).on("click","#saveServer", function(){
	if($('#serverForm').valid()){
		if(serverMode == 'edit'){
			db.transaction(function queryDB(tx) {
		        tx.executeSql('Update SERVERS set name="'+$('#serverName').val()+'", description="'+$('#serverDescription').val()
		        		+'", url="'+$('#serverUrl').val()+'" where id="'+$('#serverId').val()+'"', [], okDeleteServer, errorServerDelete);
		    }, errorServerDelete);
		} else{
			db.transaction(function queryDB(tx) {
		        tx.executeSql('Insert into SERVERS (id, name, description, url) values("'+$('#serverId').val()+'", "'+$('#serverName').val()+
		        		'", "'+$('#serverDescription').val()+'", "'+$('#serverUrl').val()+'")', [], okDeleteServer, errorServerDelete);
		    }, errorServerDelete);
		}
	}
});


//FIN FUNCIONES SERVIDORES

//INICIO REPORTES

function showIncidents(){
	var len = serversArray.length;
	console.log(len);
	for (var i=0; i<len; i++){
		console.log(serversArray[i].url);
		var id = serversArray[i].id;
		$('#incidentList').append('<li data-role="list-divider">'+serversArray[i].name+'</li>');
		response = $.ajax({
			type       : "GET",
			url        : serversArray[i].url+'/api?task=incidents',
			beforeSend : function() {$.mobile.loading('show')},
			complete   : function() {$.mobile.loading('hide')},
			data       : {},
			dataType   : 'json',
			async: false
		}).responseText;
		try{
			addIncidentToList(JSON.parse(response), id);
		} catch(e){
			$('#incidentList').append('<li>'+jQuery.i18n.prop('msg_noIncidents')+'</li>');
		}
	}
	$('#incidentList').listview('refresh');
}

function addIncidentToList(response, id){
	console.log(typeof response);
	console.log('Incidentes: '+response['payload']);
	if(response.error != null && response.error.code == '0'){
		console.log('Incidentes: '+response.payload.incidents.length);
		console.log('Server id: '+id);
		if(response.payload.incidents.length == 0){
			console.log("Entramos por el if");
			$('#incidentList').append('<li>'+jQuery.i18n.prop('msg_noIncidents')+'</li>');
		} else{
			console.log("Entramos por el else");
			var incidents = response.payload.incidents;
			for(j=0; j<incidents.length; j++){
				var incident = incidents[j]['incident'];
				$('#incidentList').append('<li><a href="#" id="s'+id+'i'+incident.incidentid+'">'
	            +'<h3 id="s'+id+'i'+incident.incidentid+'">'+incident.incidenttitle+'</h3>'
	            +'<p id="s'+id+'i'+incident.incidentid+'"><strong id="s'+id+'i'+incident.incidentid+'">'+incident.incidentdescription+'</strong></p>'
	            +'<p id="s'+id+'i'+incident.incidentid+'">'+incident.incidentdate+' '+incident.locationname+'</p>'
				+'</a></li>');
				$('#s'+id+'i'+incident.incidentid).off('click').on('click', function incidentClick(event){
					var aux = event.target.id;
					selectedIncident = aux.substring(aux.lastIndexOf('i')+1,aux.length);
					selectedServer = aux.substring(1,aux.lastIndexOf('i'));
					goToIncidentForm(event);
				});
			}
		}
	}else{
		$('#incidentList').append('<li>'+jQuery.i18n.prop('msg_noIncidents')+'</li>');
	}
}

function loadIncidentEditForm(){
	var id = 0;
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			id = i;
		}
	}
	response = $.ajax({
		type       : "GET",
		url        : serversArray[id].url+'/api?task=incidents&by=incidentid&id='+selectedIncident,
		beforeSend : function() {$.mobile.loading('show')},
		complete   : function() {$.mobile.loading('hide')},
		data       : {},
		dataType   : 'json',
		async: false
	}).responseText;
	responsParsed = JSON.parse(response);
	console.log(responsParsed);
	console.log(responsParsed[0]);
	incident = responsParsed.payload.incidents[0]['incident'];
	$('#incidentId').attr('readonly','readonly');
	$('#incidentId').removeAttr('data-clear-btn');
	$('#incidentId').textinput();
	$('#incidentTitle').attr('readonly','readonly');
	$('#incidentTitle').removeAttr('data-clear-btn');
	$('#incidentTitle').textinput();
	$('#incidentDescription').attr('readonly','readonly');
	$('#incidentDescription').removeAttr('data-clear-btn');
	$('#incidentLocation').attr('readonly','readonly');
	$('#incidentLocation').removeAttr('data-clear-btn');
	$('#incidentDate').attr('readonly','readonly');
	$('#incidentDate').removeAttr('data-clear-btn');
	$('#incidentTime').attr('readonly','readonly');
	$('#incidentTime').removeAttr('data-clear-btn');
	
	$('#incidentId').val(incident.incidentid);
	$('#incidentTitle').val(incident.incidenttitle);
	$('#incidentDescription').val(incident.incidentdescription);
	$('#incidentLatitude').val(incident.locationlatitude);
	$('#incidentLongitude').val(incident.locationlongitude);
	$('#incidentLocation').val(incident.locationname);
	var dateIncident = incident.incidentdate.substring(8,10)+'/'+incident.incidentdate.substring(5,7)+'/'+incident.incidentdate.substring(0,4);
	$('#incidentDate').val(dateIncident);
	$('#incidentTime').val(incident.incidentdate.substring(12,incident.incidentdate.length));
	$('#listParamsIncidents').listview('refresh');
	$('#incidentCategory').empty();
	var categories = responsParsed.payload.incidents[0]['categories'];
	for(var i=0;i<categories.length; i++){
		var category = categories[i]['category'];
		$('#incidentCategory').append('<option value="'+category.id+'" selected="true">'+category.title+'</option>');
	}
	$('#incidentCategory').selectmenu('disable');
	$('#incidentCategory').selectmenu("refresh");
	var incidentLocation = new google.maps.LatLng(incident.locationlatitude, incident.locationlongitude);
	
	map  = new google.maps.Map(document.getElementById('incidentMap'), {
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		center: incidentLocation,
		zoom: 15,
	});
	
	google.maps.event.trigger(map, 'resize');
	
	var currentPositionMarker = new google.maps.Marker({
    	position: incidentLocation,
    	map: map,
    	title: incident.incidenttitle
    });
}

function loadIncidentAddForm(){
	$('#incidentId').removeAttr('readonly');
	$('#incidentId').val("");
	$('#incidentTitle').removeAttr('readonly');
	$('#incidentTitle').val("");
	$('#incidentDescription').removeAttr('readonly');
	$('#incidentDescription').val("");
	var date = new Date();
	var hour = date.getHours();
	var ampm = 'am';
	if(hour > 12){
		hour = hour - 12;
		ampm = 'pm';
	}
	var min = date.getMinutes();
	var dd = date.getDate();
	if(dd < 10){
		dd = '0'+dd;
	}
	var mm = date.getMonth() + 1;
	if(mm < 10){
		mm = '0'+mm;
	}
	var yyyy = date.getFullYear();
	$('#incidentDate').val(dd+'/'+mm+'/'+yyyy);
	$('#incidentTime').val(hour+':'+min+' '+ampm);
	$('#incidentLatitude').val("");
	$('#incidentLongitude').val("");
	$('#incidentLocation').val("");
	$('#incidentLocation').removeAttr('readonly');
	$('#incidentCategory').empty();
	$('#incidentCategory').selectmenu('enable');
	var id = 0;
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			id = i;
		}
	}
	response = $.ajax({
		type       : "GET",
		url        : serversArray[id].url+'/api?task=categories',
		beforeSend : function() {$.mobile.loading('show')},
		complete   : function() {$.mobile.loading('hide')},
		data       : {},
		dataType   : 'json',
		async: false
	}).responseText;
	responsParsed = JSON.parse(response);
	var categories = responsParsed.payload.categories;
	for(var i=0;i<categories.length; i++){
		var category = categories[i]['category'];
		$('#incidentCategory').append('<option value="'+category.id+'">'+category.title+'</option>');
	}
	$('#incidentCategory').selectmenu("refresh");
	$('#listParamsIncidents').listview('refresh');
	
	navigator.geolocation.getCurrentPosition(function onSuccessMap(position){
		$('#incidentLatitude').val(position.coords.latitude);
		$('#incidentLongitude').val(position.coords.longitude);
		var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		map  = new google.maps.Map(document.getElementById('incidentMap'), {
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			center: myLocation,
			zoom: 15,
		});
	
		google.maps.event.trigger(map, 'resize');
	}, onError);
}

$(document).on('change', '#incidentLocation', function(){
	if ($('#incidentLocation').val() != null || $('#incidentLocation').val() != '') {
		var map = new google.maps.Map(document
				.getElementById('incidentMap'), {
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			zoom : 15
		});

		var geocoder = new google.maps.Geocoder();

		geocoder.geocode(
				{
					'address' : document
							.getElementById('incidentLocation').value
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						$('#incidentLatitude').val(results[0].geometry.location.lat());
						$('#incidentLongitude').val(results[0].geometry.location.lng());
						new google.maps.Marker({
							position : results[0].geometry.location,
							map : map
						});
						map.setCenter(results[0].geometry.location);
					} else {
						alert("No se ha encontrado ubicación");
						$('#incidentLatitude').val("");
						$('#incidentLongitude').val("");
					}
				});

		google.maps.event.trigger(map, 'resize');
	}
});

$(document).on('click', '#headerSubmitReport', function(){
	var id = 0;
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			id = i;
		}
	}
	if($('#incidentForm').valid()){
		time = $('#incidentTime').val().toString();
		date = $('#incidentDate').val().toString();
		date = date.substring(3,5)+'/'+date.substring(0,2)+date.substring(5,date.length);
		$.ajax({
			type       : "POST",
			url        : serversArray[id].url+'/api?task=report',
			beforeSend : function() {$.mobile.loading('show')},
			complete   : function() {$.mobile.loading('hide')},
			data: {task: "report", incident_title: $('#incidentTitle').val(),
				incident_description: $('#incidentDescription').val(),
				incident_date: date,
				incident_hour: time.substring(0,time.lastIndexOf(':')),
				incident_minute: time.substring(time.lastIndexOf(':')+1,time.lastIndexOf(' ')),
				incident_ampm: time.substring(time.length-2,time.length),
				incident_category: $('#incidentCategory').val().toString(),
				latitude: $('#incidentLatitude').val(),
				longitude: $('#incidentLongitude').val(),
				location_name: $('#incidentLocation').val()},
			async: true,
			dataType: 'text',
			success: function (response){
				console.log(response);
				$.mobile.back();
				alert(""+jQuery.i18n.prop('msg_submit_report_OK'));
			},
			error: function (request,error) {
				alert("Error"+error.toString());
			}
		});
	}
});

function getComments(){
	var id = 0;
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			id = i;
		}
	}
	$.ajax({
		type       : "GET",
		url        : serversArray[id].url+'/api?task=comments&by=reportid&id='+selectedIncident,
		beforeSend : function() {$.mobile.loading('show')},
		complete   : function() {$.mobile.loading('hide')},
		data: {},
		async: true,
		dataType: 'json',
		success: function (response){
			var comments = response.payload.comments;
			if(response.error.code == '0'){
				for(var i=0; i<comments.length; i++){
					var comment = comments[i]['comment'];
					$('#commentsList').append('<li><strong>'+comment.comment_author+' </strong>('+comment.comment_date+')<br/><br/>'
							+'<p>'+comment.comment_description+'</p></li>');
				}
			}else{
				$('#commentsList').append('<li>'+jQuery.i18n.prop('msg_noComments')+'</li>');
			}
			$('#commentsList').listview('refresh');
		},
		error: function (request,error) {
			alert("Error"+error);
		}
	});
}

$(document).on("click","#headerSaveComent", function(){
	var id = 0;
	for(var i=0; i<serversArray.length; i++){
		if(selectedServer == serversArray[i].id){
			id = i;
		}
	}	
	if($('#commentForm').valid()){
		$.ajax({
			type       : "POST",
			url        : serversArray[id].url+'/api?task=comments&action=add',
			beforeSend : function() {$.mobile.loading('show')},
			complete   : function() {$.mobile.loading('hide')},
			data: {task: "comments", action: "add", incident_id: selectedIncident,
				comment_author: $('#commentAuthor')},
			async: true,
			dataType: 'text',
			success: function (response){
				alert(response);
				console.log(response);
				$.mobile.back();
			},
			error: function (request,error) {
				alert("Error"+error);
			}
		});
	}
});

//FIN REPORTES