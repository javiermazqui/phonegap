function DOMLoaded(){
	document.addEventListener("deviceready", phonegapLoaded, false);
	navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function phonegapLoaded(){

}

function onSuccess(position) { 
    var myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    map  = new google.maps.Map(document.getElementById('map_canvas'), {
	mapTypeId: google.maps.MapTypeId.ROADMAP,
	center: myLocation,
	zoom: 15,
    });
    
    var currentPositionMarker = new google.maps.Marker({
    	position: myLocation,
    	map: map,
    	title: "Current position"
    });
    currentRadiusValue = 300;
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

function callPolice(){
	document.location.href = 'tel:+34 679 956 731';
}

function callFire(){
	document.location.href = 'tel:+34 679 956 731';
}

function callEmergencies(){
	document.location.href = 'tel:+34 679 956 731';
}