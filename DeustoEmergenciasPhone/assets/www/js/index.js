function DOMLoaded(){
	document.addEventListener("deviceready", phonegapLoaded, false);
	navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function phonegapLoaded(){
	$('#botonera').append('<img alt="" src="img/emergencias.jpg">');
}

function onSuccess(position) { 
    var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    map  = new google.maps.Map(document.getElementById('map_canvas'), {
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	center: myLocation,
	zoom: 15
    });
    
    var element = document.getElementById('comentarios');
    element.innerHTML = 'Latitude: '           + position.coords.latitude              + '<br />' +
                        'Longitude: '          + position.coords.longitude             + '<br />' +
                        'Altitude: '           + position.coords.altitude              + '<br />' +
                        'Accuracy: '           + position.coords.accuracy              + '<br />' +
                        'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
                        'Heading: '            + position.coords.heading               + '<br />' +
                        'Speed: '              + position.coords.speed                 + '<br />' +
                        'Timestamp: '          +                                   position.timestamp          + '<br />';
    var currentPositionMarker = new google.maps.Marker({
    	position: myLocation,
    	map: map,
    	title: "Current position"
    });
    var request = { location: myLocation, radius: currentRadiusValue, types: ['policia'] }; 
    var service = new google.maps.places.PlacesService(map); 
    service.nearbySearch(request, callback);
}

function onError(error) {
    alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
}

function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
	map: map,
	position: place.geometry.location
    }); 
}