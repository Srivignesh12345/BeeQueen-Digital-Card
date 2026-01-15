/* ======================
   STATS COUNTER
====================== */
const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {
  const target = +counter.dataset.target;
  const suffix = counter.dataset.suffix || "";
  const duration = 1800;
  const start = performance.now();

  function animate(time) {
    const progress = Math.min((time - start) / duration, 1);
    counter.textContent = Math.floor(progress * target) + suffix;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});


/* ======================
   BEE QUEEN FORM SUBMIT
====================== */
document
  .getElementById("beeQueenForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const formData = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      phone: e.target.phone.value,
      email: e.target.email.value,

      services: [...document.querySelectorAll(
        'input[name="services[]"]:checked'
      )]
        .map(cb => cb.value)
        .join(", "),

      customization: e.target.customization.value
    };

    try {
      const res = await fetch("/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ Thank you! Your request has been sent successfully.");
        e.target.reset();
      } else {
        alert("❌ Something went wrong. Please try again.");
      }
    } catch (err) {
      alert("⚠️ Server not reachable");
    }
  });
document.getElementById("beeQueenForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("formStatus");

  const formData = {
    first_name: e.target.first_name.value,
    last_name: e.target.last_name.value,
    phone: e.target.phone.value,
    email: e.target.email.value,
    services: [...document.querySelectorAll('input[name="services[]"]:checked')]
      .map(cb => cb.value)
      .join(", "),
    customization: e.target.customization.value
  };

  try {
    const res = await fetch("http://localhost:5000/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const result = await res.json();

    if (result.success) {
      status.innerHTML = "✅ Thank you! We will contact you shortly.";
      status.style.color = "green";
      e.target.reset();
    } else {
      throw new Error("Mail failed");
    }
  } catch (error) {
    status.innerHTML = "❌ Something went wrong. Please try again.";
    status.style.color = "red";
    console.error(error);
  }
});
