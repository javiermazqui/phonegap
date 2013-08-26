
document.addEventListener("pause", onPause, false);

var pushNotification;

var servers;

function DOMLoaded(){
	document.addEventListener("deviceready", phonegapLoaded, false);
	navigator.geolocation.getCurrentPosition(onSuccessMap, onError);
}

function phonegapLoaded(){
	init_db();
	init_notifications();
}

//INICIO FUNCIONES NAVEGACION
$( document ).on( "pagecreate", function(){
	$( document ).one( "click", "#servers", function () {
    	console.log("Servers");
    	$('#dinamicWrapper').load('servers.html');
    });
    $( document ).one( "click", "#reports", function () {
    	console.log("Reports");
    	$('#dinamicWrapper').load('reports.html');
    });
    $( document ).one( "click", "#webView", function () {
    	console.log("Web view");
    	$('#dinamicWrapper').load('https://deustoemer.hol.es/ushahidi');
    });
    $( document ).one( "click", "#settings", function () {
    	console.log("Settings");
    	$('#dinamicWrapper').load('settings.html');
    });
    $( document ).one( "click", "#about", function () {
    	console.log("About");
    	$('#dinamicWrapper').load('about.html');
    });
});

//FIN FUNCIONES NAVEGACION

// INICIO FUNCIONES BBDD

function init_db(){
	db = window.openDatabase('DeustoEmer', '1.0', 'Deusto Emergencias', '10000000');
	db.transaction(populateDB, errorCB, getServersDB);
}

function populateDB(tx) {
	tx.executeSql('DROP TABLE IF EXISTS SERVERS');
	tx.executeSql('CREATE TABLE IF NOT EXISTS SERVERS (id unique, name, description, url)');
    tx.executeSql('INSERT INTO SERVERS (id, name, description, url) VALUES (1, "Deusto emergencias", "Deusto emergencias", "http://deustoemer.hol.es/ushahidi")');
    tx.executeSql('INSERT INTO SERVERS (id, name, description, url) VALUES (2, "Deusto emergencias", "Deusto emergencias", "http://deustoemer.hol.es/ushahidi")');
}

function errorCB(err) {
	 console.log("Error processing SQL: "+err.code);
}

function successCB() {
   console.log("success!");
   getServersDB();
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
				request.open("GET", "http://deustoemer.hol.es/ushahidi/push/storeUser/"+e.regid, true);
				request.onreadystatechange = function(){
					if (request.readyState == 4) {
						if (request.status == 200 || request.status == 0) {
							alert(request.response);
						}
					}
				}
				request.send();
			}
		break;
            
		case 'message':
        	// if this flag is set, this notification happened while we were in the foreground.
        	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
			alert(e.payload.message);
			alert(e.payload.msgcnt);
        break;
        
		case 'error':
			$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
        break;
        
        default:
			$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
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

//FIN FUNCIONES GOOGLE MAPS

//INICIO FUNCIONES PANTALLA PRINCIPAL

function callPolice(){
	document.location.href = 'tel:+34 679 956 731';
}

function callFire(){
	document.location.href = 'tel:+34 679 956 731';
}

function callEmergencies(){
	document.location.href = 'tel:+34 679 956 731';
}

//FIN FUNCIONES PANTALLA PRINCIPAL


//INICIO FUNCIONES SERVIDORES

function getServersDB(){
	db = window.openDatabase('DeustoEmer', '1.0', 'Deusto Emergencias', '10000000');
    db.transaction(function queryDB(tx) {
        tx.executeSql('SELECT * FROM SERVERS', [], getServersSuccess, errorCB);
    }, errorCB);
}

//Query the success callback
//
function getServersSuccess(tx, results) {
    var len = results.rows.length;
    console.log("SERVERS table: " + len + " rows found.");
    for (var i=0; i<len; i++){
        console.log("Row = " + i + " ID = " + results.rows.item(i).id + " Name =  " + results.rows.item(i).name
        		+ " Description = "+ results.rows.item(i).description + " URL = "+results.rows.item(i).url);
        console.log("ITEM: "+results.rows.item(i));
    }
    servers = results.rows;
}

function showServers(){
	var len = servers.length;
	for (var i=0; i<len; i++){
		$('#serverList').append('<li><a href="#" id="'+servers.item(i).id+'">'+servers.item(i).name+'</a></li>');
	}
	$('#indexPage').trigger("pagecreate");
}

//FIN FUNCIONES SERVIDORES

//INICIO REPORTES

function showIncidents(){
	var len = servers.length;
	console.log(len);
	for (var i=0; i<len; i++){
		console.log(servers.item(i).url);
		var id = servers.item(i).id;
		$('#incidentList').append('<li data-role="list-divider">'+servers.item(i).name+'</li>');
		response = $.ajax({
			type       : "GET",
			url        : servers.item(i).url+'/api?task=incidents',
			beforeSend : function() {$.mobile.loading('show')},
			complete   : function() {$.mobile.loading('hide')},
			data       : {},
			dataType   : 'json',
			async: false
		}).responseText;
		addIncidentToList(JSON.parse(response), id);
	}
}

function addIncidentToList(response, id){
	console.log(typeof response);
	console.log('Incidentes: '+response['payload']);
	console.log('Incidentes: '+response.payload.incidents.length);
	console.log('Server id: '+id);
	if(response.payload.incidents.length == 0){
		console.log("Entramos por el if");
		$('#incidentList').append('<li data-role="list-divider">No se han recuperado incidentes</li>');
	} else{
		console.log("Entramos por el else");
		for(j=0; j<response.payload.incidents.length; j++){
			$('#incidentList').append('<li><a href="#" id="'+response.payload.incidents[j]['incident'].incidentid+'">'
            +'<h3>'+response.payload.incidents[j]['incident'].incidenttitle+'</h3>'
            +'<p><strong>'+response.payload.incidents[j]['incident'].incidentdescription+'</strong></p>'
            +'<p>'+response.payload.incidents[j]['incident'].incidentdate+' '+response.payload.incidents[j]['incident'].locationname+'</p>'
			+'</a></li>');
		}
	}
}

//FIN REPORTES