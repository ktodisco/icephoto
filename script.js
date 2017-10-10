// At the equator, each degree of longitude is equal to 111319.9 m.
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

function rotateImage(modalImage, degrees) {
	var rotationString = "rotate(" + degrees + "deg)";
	
	// Support chrome, firefox, and IE.
	modalImage.style.webkitTransform = rotationString;
	modalImage.style.mozTransform = rotationString;
	modalImage.style.msTransform = rotationString;
}

function addImages(map, fieldOfView, modal, modalImage, imageList) {
	var allImages = document.getElementsByClassName('hidden_image');
	
	for (var i = 0; i < allImages.length; ++i) {
		var photo = allImages.item(i);
		
		var latitude = parseFloat(photo.getAttribute('data-lat'));
		var longitude = parseFloat(photo.getAttribute('data-lng'));
		
		var marker = new google.maps.Circle({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.3,
			map: map,
			center: {lat: latitude, lng: longitude },
			radius: circleSize(map.getZoom()),
			zIndex: 5
		});
		
		google.maps.event.addListener(marker, 'mouseover', (function (marker, photo, i) {
			return function () {
				fieldOfView.setOptions({
					visible: true
				});
				
				var heading = parseFloat(photo.getAttribute('data-head'));
				var fov = parseFloat(photo.getAttribute('data-fov'));
				
				fieldOfView.setPath(buildFieldOfView(
					marker.getCenter(),
					circleSize(map.getZoom()) * 10,
					heading,
					fov));
			}
		})(marker, photo, i));
		
		google.maps.event.addListener(marker, 'mouseout', (function (marker, i) {
			return function () {
				marker.setOptions({
					fillColor: '#FF0000'
				});
				
				fieldOfView.setOptions({
					visible: false
				});
				
				fieldOfView.setPath(Array());
			}
		})(marker, i));
		
		google.maps.event.addListener(marker, 'click', (function (photo, i) {
			return function () {
				modal.style.display = "block";
				modalImage.src = photo.src;
				
				var rotation = photo.getAttribute('data-rotate');
				rotateImage(modalImage, rotation);
			}
		})(photo, i));

		imageList.push(marker);
	}
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: {lat: 63.9531, lng: -19.1469},
		mapTypeId: 'hybrid'
	});
	
	var modal = document.getElementById('modal_div');
	var modalImage = document.getElementById('modal_image');
	var modalClose = document.getElementsByClassName('modal_close')[0];
	
	modalClose.onclick = function() {
		modal.style.display = "none";
	}
	
	// One one field-of-view indicator is ever seen at a time, so create it once
	// here.
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

	// Populate the data to highlight the trail.
	// Coordinates are in coords.js.
	map.data.add({geometry: new google.maps.Data.LineString(hikeCoords)});
	
	var allImages = [];
	addImages(map, fieldOfView, modal, modalImage, allImages);
	
	// Change the size of the photo markers depending on the zoom level.
	map.addListener('zoom_changed', function() {
		for (var i = 0; i < allImages.length; ++i) {
			allImages[i].setOptions({
				radius: circleSize(map.getZoom())
			});
		}
	});
	
	// Utility: right click prints 
	map.addListener('rightclick', function(e) {
		console.log(e.latLng.lat());
		console.log(e.latLng.lng());
	});
}