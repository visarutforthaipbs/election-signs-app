document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("campaignForm");
  const locationInput = document.getElementById("location");
  const toggleFormButton = document.getElementById("toggleFormButton");
  const placeMarkerButton = document.getElementById("placeMarkerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarContent = document.getElementById("sidebar-content");
  const closeSidebar = document.getElementById("closeSidebar");

  // Initialize the map without zoom control
  const map = L.map("map", {
    zoomControl: false,
  }).setView([13.736717, 100.523186], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  // Load GeoJSON data for provinces and add to the map
  fetch("thailand-provinces.geojson")
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data, {
        style: function (feature) {
          return {
            color: "#FCB34E",
            weight: 4,
            opacity: 0.3,
            fillOpacity: 0.1,
          };
        },
      }).addTo(map);
    })
    .catch((error) => console.error("Error loading GeoJSON data:", error));

  let newMarker;

  // Handle the place marker button click
  placeMarkerButton.addEventListener("click", () => {
    map.on("click", function (e) {
      if (newMarker) {
        map.removeLayer(newMarker);
      }
      newMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
      locationInput.value = `${e.latlng.lat}, ${e.latlng.lng}`;

      newMarker.on("dragend", function (event) {
        const marker = event.target;
        const position = marker.getLatLng();
        marker
          .setLatLng(position, { draggable: true })
          .bindPopup(position)
          .update();
        locationInput.value = `${position.lat}, ${position.lng}`;
      });

      // Remove the map click event after placing the marker
      map.off("click");
    });
  });

  // Load existing campaign signs from Firestore
  const loadMarkers = async () => {
    try {
      const snapshot = await db
        .collection("campaignSigns")
        .orderBy("timestamp", "desc")
        .get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        const [lat, lng] = data.location.split(",").map(Number);
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on("click", () => {
          sidebarContent.innerHTML = `
            <h2>ชื่อผู้สมัคร:</h2>
            <p>${data.candidateName}</p>
            <h2>พรรคการเมือง:</h2>
            <p>${data.party}</p>
            <h2>ข้อความนโยบาย:</h2>
            <p>${data.policyMessage}</p>
            <h2>รูปภาพป้ายหาเสียง:</h2>
            <img src="${data.signImageUrl}" width="100%">
          `;
          sidebar.classList.add("visible");
        });
        marker.on("dragend", function (event) {
          const marker = event.target;
          const position = marker.getLatLng();
          marker
            .setLatLng(position, { draggable: true })
            .bindPopup(position)
            .update();
        });
      });
    } catch (error) {
      console.error("Error loading markers: ", error); // Error handling
    }
  };

  // Load markers when the page loads
  loadMarkers();

  // Toggle form visibility
  toggleFormButton.addEventListener("click", () => {
    if (form.style.display === "none" || form.style.display === "") {
      form.style.display = "flex";
      toggleFormButton.textContent = "ปิดฟอร์ม";
    } else {
      form.style.display = "none";
      toggleFormButton.textContent = "แชร์ป้ายหาเสียง";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const location = locationInput.value;
    const candidateName = document.getElementById("candidateName").value;
    const party = document.getElementById("party").value;
    const policyMessage = document.getElementById("policyMessage").value;
    const signImage = document.getElementById("signImage").files[0];

    // Upload image to Firebase Storage
    const storageRef = storage.ref();
    const signImageRef = storageRef.child(`signs/${signImage.name}`);
    await signImageRef.put(signImage);
    const signImageUrl = await signImageRef.getDownloadURL();

    // Save data to Firestore
    await db.collection("campaignSigns").add({
      location,
      candidateName,
      party,
      policyMessage,
      signImageUrl,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Show modal alert
    showModalAlert("แชร์ข้อมูลสำเร็จแล้ว!");

    form.reset();
    form.style.display = "none";
    toggleFormButton.textContent = "แชร์ป้ายหาเสียง";

    // Add marker to the map
    const [lat, lng] = location.split(",").map(Number);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("click", () => {
      sidebarContent.innerHTML = `
        <h2>ชื่อผู้สมัคร:</h2>
        <p>${candidateName}</p>
        <h2>พรรคการเมือง:</h2>
        <p>${party}</p>
        <h2>ข้อความนโยบาย:</h2>
        <p>${policyMessage}</p>
        <h2>รูปภาพป้ายหาเสียง:</h2>
        <img src="${signImageUrl}" width="100%">
      `;
      sidebar.classList.add("visible");
    });
    marker.on("dragend", function (event) {
      const marker = event.target;
      const position = marker.getLatLng();
      marker
        .setLatLng(position, { draggable: true })
        .bindPopup(position)
        .update();
    });

    // Reload markers
    loadMarkers();
  });

  // Close the sidebar
  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("visible");
  });

  // Function to show modal alert
  function showModalAlert(message) {
    const modal = document.createElement("div");
    modal.className = "modal-alert";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(modal);

    const closeButton = modal.querySelector(".close-button");
    closeButton.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
});
