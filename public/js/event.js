const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function load(){
  const data = await api("/events");
  const e = data.find(x => x._id === id);

  document.getElementById("title").innerText = e.name;
  document.getElementById("seats").innerText =
    e.availableSeats + " seats available";
}

async function book(){

  const res = await api(`/events/${id}/book`, "POST");

  if(res.ticket){

    window.location.href =

      "ticket.html?code=" + res.ticket.ticketCode;

  } else {

    alert(res.message || "Booking failed");

  }

}

load();