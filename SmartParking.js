let map;
let selectedSpot;
const parkingSpots = [
    { id: 1, name: 'Parking Ole Vigs gate', availability: 'Available', location: { lat: 59.92954328003108, lng: 10.717905267083758 }, reservations: [] },
    { id: 2, name: 'Parking Jacob Aalls gate', availability: 'Occupied', location: { lat: 59.92890924257039, lng: 10.718070707428616 }, reservations: [] },
    { id: 3, name: 'Parking Jacob Aalls gate', availability: 'Available', location: { lat: 59.928249077319855, lng: 10.716561251732704 }, reservations: [] },
    { id: 4, name: 'Parking Valkyriegata', availability: 'Available', location: { lat: 59.92808391799407, lng: 10.718728875127578 }, reservations: [] },
    { id: 5, name: 'Parking Sorgenfrigata', availability: 'Available', location: { lat: 59.928091911943184, lng: 10.719928786391703 }, reservations: [] },
    { id: 6, name: 'Parking Sorgenfrigata', availability: 'Available', location: { lat: 59.927168837896254, lng: 10.717757936350225 }, reservations: [] },
    { id: 7, name: 'Parking Majorstuveien', availability: 'Available', location: { lat: 59.92760289474405, lng: 10.715617876558257 }, reservations: [] },
    { id: 8, name: 'Parking Neubergata', availability: 'Available', location: { lat: 59.927609411967246, lng: 10.716734759541488 }, reservations: [] },
    { id: 9, name: 'Parking Gjorstadsgata', availability: 'Available', location: { lat: 59.926415283487906, lng: 10.718382960155482 }, reservations: [] },
    { id: 10, name: 'HC Parking Harald Haarfagres gate', availability: 'Available', hc: true, location: { lat: 59.93030945123256, lng: 10.715864449276703 }, reservations: [] },
    { id: 11, name: 'HC Parking Trudvangveien', availability: 'Available', hc: true, location: { lat: 59.93144796925998, lng: 10.716655932603869 }, reservations: [] }
];

function initMap() {
    const majorstuen = { lat: 59.926810264293046, lng: 10.7163941721516 }; // Coordinates for Majorstuen, Oslo, Norway
    map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 15,
        center: majorstuen
    });
    addParkingMarkers();
}

function addParkingMarkers() {
    parkingSpots.forEach(spot => {
        const marker = new google.maps.Marker({
            position: spot.location,
            map: map,
            title: spot.name
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${spot.name}</strong><br>Availability: ${spot.availability}${spot.hc ? '<br><em>Requires evidence paper in front window</em>' : ''}`
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });
}

document.getElementById('search-button').addEventListener('click', function() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    fetchParkingSpots(searchTerm);
});

function fetchParkingSpots(location) {
    if (location !== 'majorstuen') {
        displayMessage('error', 'No parking spots found for the given location.');
        return;
    }
    const parkingSpotsContainer = document.getElementById('parking-spots');
    parkingSpotsContainer.innerHTML = '';

    parkingSpots.forEach(spot => {
        const spotElement = document.createElement('li');
        spotElement.textContent = `${spot.name} - ${spot.availability}`;
        if (spot.hc) {
            spotElement.textContent += ' (Requires evidence paper in front window)';
        }
        if (spot.availability === 'Available') {
            const reserveButton = document.createElement('button');
            reserveButton.textContent = 'Reserve';
            reserveButton.addEventListener('click', function() {
                openReservationModal(spot);
            });
            spotElement.appendChild(reserveButton);
        }
        parkingSpotsContainer.appendChild(spotElement);
    });
}

function openReservationModal(spot) {
    selectedSpot = spot;
    document.getElementById('reservation-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

document.getElementById('modal-overlay').addEventListener('click', function() {
    closeReservationModal();
});

function closeReservationModal() {
    document.getElementById('reservation-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

document.getElementById('reservation-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const reservationTime = document.getElementById('reservation-time').value;
    const email = document.getElementById('email').value;
    const [startTime, endTime] = reservationTime.split('-').map(time => time.trim());

    if (isTimeSlotAvailable(selectedSpot, startTime, endTime)) {
        reserveParkingSpot(selectedSpot, startTime, endTime, email);
        closeReservationModal();
    } else {
        displayMessage('error', 'The selected time slot is not available. Please choose a different time.');
    }
});

function isTimeSlotAvailable(spot, startTime, endTime) {
    for (const reservation of spot.reservations) {
        if (
            (startTime >= reservation.startTime && startTime < reservation.endTime) ||
            (endTime > reservation.startTime && endTime <= reservation.endTime) ||
            (startTime <= reservation.startTime && endTime >= reservation.endTime)
        ) {
            return false;
        }
    }
    return true;
}

function reserveParkingSpot(spot, startTime, endTime, email) {
    if (spot.hc) {
        alert('Note: You must have an evidence paper displayed in the front window when parking in an HC spot.');
    }

    spot.reservations.push({ startTime, endTime });
    displayMessage('success', `Parking Spot ${spot.name} reserved from ${startTime} to ${endTime}! A confirmation email has been sent to ${email}`);
    updateReservationsList();
    fetchParkingSpots('majorstuen');
}

function updateReservationsList() {
    const reservationsContainer = document.getElementById('reservations-list');
    reservationsContainer.innerHTML = '';

    parkingSpots
        .flatMap(spot => spot.reservations.map(reservation => ({ ...reservation, spotName: spot.name })))
        .forEach(reservation => {
            const reservationElement = document.createElement('li');
            reservationElement.textContent = `${reservation.spotName} - Reserved from: ${reservation.startTime} to ${reservation.endTime}`;
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', function() {
                cancelReservation(reservation);
            });
            reservationElement.appendChild(cancelButton);
            reservationsContainer.appendChild(reservationElement);
        });
}

function cancelReservation(reservation) {
    const spot = parkingSpots.find(s => s.name === reservation.spotName);
    const index = spot.reservations.findIndex(r => r.startTime === reservation.startTime && r.endTime === reservation.endTime);
    if (index > -1) {
        spot.reservations.splice(index, 1);
        displayMessage('success', `Reservation for Parking Spot ${spot.name} from ${reservation.startTime} to ${reservation.endTime} cancelled.`);
        updateReservationsList();
        fetchParkingSpots('majorstuen');
    }
}

function displayMessage(type, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type === 'error' ? 'error-message' : type === 'success' ? 'success-message' : 'info-message'}`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}
