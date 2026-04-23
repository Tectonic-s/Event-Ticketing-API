const BASE = "/api";

let token = localStorage.getItem("token");

async function api(url, method="GET", body){
  const res = await fetch(BASE + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && {Authorization: "Bearer " + token})
    },
    body: body ? JSON.stringify(body) : null
  });

  return res.json();
}