async function login(){
  const res = await api("/auth/login","POST",{
    email: email.value,
    password: password.value
  });

  localStorage.setItem("token", res.token);
  window.location.href = "home.html";
}