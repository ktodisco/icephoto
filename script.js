// At the equator, each degree of longitude is equal to 111.3199 km.
const kOneDegreeMeters = 111319.9;
var map;
var fieldOfView;

function degreesToRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function metersToLatitude(meters) {
	// Latitude distance does not change across the surface of the Earth.
	return meters / kOneDegreeMeters;
}

function metersToLongitude(meters, lat) {
	// Longitudinal distance changes with latitude, equal to the cosine
	// of the latitude.
	var cosLat = Math.cos(degreesToRadians(lat));
	return meters / (kOneDegreeMeters * cosLat);
}

function circleSize(zoomLevel) {
	// TODO: At zoom level 20+ this will be NaN.
	return Math.pow(6, Math.sqrt(22 - zoomLevel - 3));
}

function rotatePoint(point, degrees) {
	var radians = degreesToRadians(degrees);
	var sin = Math.sin(radians);
	var cos = Math.cos(radians);
	
	return [point[0] * cos - point[1] * sin, point[0] * sin + point[1] * cos];
}

function buildFieldOfView(center, radius, dir, angle) {
	// A direction of 0 degrees due north.
	var start = [0, radius];
	// Start at negative half-angle and then sweep forward at increments
	// of one degree.
	var startAngle = dir - (angle / 2);
	
	var points = Array();
	points.push(center);
	
	var nextPoint = rotatePoint(start, startAngle);
	var newLat = center.lat() + metersToLatitude(nextPoint[1]);
	var newLng = center.lng() + metersToLongitude(nextPoint[0], newLat);
	var newPoint = new google.maps.LatLng(newLat, newLng);
	points.push(newPoint);
	
	for (var i = 0; i < angle; ++i) {
		nextPoint = rotatePoint(nextPoint, 1);
		newLat = center.lat() + metersToLatitude(nextPoint[1]);
		newLng = center.lng() + metersToLongitude(nextPoint[0], newLat);
		newPoint = new google.maps.LatLng(newLat, newLng);
		points.push(newPoint);
	}
	
	return points;
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: 63.5294, lng: -19.5126},
		mapTypeId: 'terrain'
	});
	
	var modal = document.getElementById('modal_div');
	var modalImage = document.getElementById('modal_image');
	var sampleImage = document.getElementById('sample_image');
	var modalClose = document.getElementsByClassName('modal_close')[0];
	
	modalClose.onclick = function() {
		modal.style.display = "none";
	}
	
	fieldOfView = new google.maps.Polygon({
		strokeColor: '#000000',
		strokeWeight: 2,
		strokeOpacity: 0.8,
		fillColor: '#000000',
		fillOpacity: 0.3,
		map: map,
		visible: false,
		zIndex: 2
	});

	var coords = [
		{ lat: 63.5294, lng: -19.5126 },
		{ lat: 63.5449, lng: -19.5003 },
		{ lat: 63.5624, lng: -19.4870 },
		{ lat: 63.5770, lng: -19.4466 },
		{ lat: 63.6018, lng: -19.4466 },
		{ lat: 63.6368, lng: -19.4436 },
		{ lat: 63.6520, lng: -19.4291 },
		{ lat: 63.6760, lng: -19.4605 },
		{ lat: 63.6787, lng: -19.4720 }
	];

	/*var path = new google.maps.Polyline({
		path: coords,
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	path.setMap(map);*/

	map.data.add({geometry: new google.maps.Data.LineString(coords)});
	
	var photo = new google.maps.Circle({
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.3,
		map: map,
		center: {lat: 63.5310, lng: -19.5124 },
		radius: circleSize(map.getZoom()),
		zIndex: 5
	});
	
	photo.addListener('mouseover', function() {
		fieldOfView.setOptions({
			visible: true
		});
		
		fieldOfView.setPath(buildFieldOfView(
			photo.getCenter(),
			circleSize(map.getZoom()) * 10,
			-25.0,
			30.0));
	});
	
	photo.addListener('mouseout', function() {
		photo.setOptions({
			fillColor: '#FF0000'
		});
		
		fieldOfView.setOptions({
			visible: false
		});
		
		fieldOfView.setPath(Array());
	});
	
	photo.addListener('click', function() {
		modal.style.display = "block";
		modalImage.src = sampleImage.src;
	});
	
	map.addListener('zoom_changed', function() {
		photo.setOptions({
			radius: circleSize(map.getZoom())
		});
		console.log(map.getZoom());
		console.log(circleSize(map.getZoom()));
	});
}