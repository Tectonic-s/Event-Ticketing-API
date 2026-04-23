async function load(){
  const data = await api("/events");

  document.getElementById("events").innerHTML =
    data.map(e => `
      <div class="card">
        <h3>${e.name}</h3>
        <p>🎟️ ${e.availableSeats} seats available</p>

        <a href="event.html?id=${e._id}">
          <button>Book Now</button>
        </a>
      </div>
    `).join('');
}

load();