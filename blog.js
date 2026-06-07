/* ============================
   BLOG SYSTEM – Bee Queen
   Firebase + Cloudinary
   ============================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ---------- CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCPDv8ICkmZ1wAsaBGnAY--FTRa-f8DDrQ",
  authDomain: "beequeensite.firebaseapp.com",
  projectId: "beequeensite",
  storageBucket: "beequeensite.firebasestorage.app",
  messagingSenderId: "1051155349971",
  appId: "1:1051155349971:web:4e69ad637322dad16b6f26"
};

const CLOUDINARY_CLOUD = "dq1ta9gxe";
const CLOUDINARY_PRESET = "beequeen_uploads";
const ADMIN_PASSWORD = "Beequeen@123";

/* ---------- INIT ---------- */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const postsRef = collection(db, "blog_posts");

/* ============================
   ADMIN LOGIN
   ============================ */
function adminLogin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem("bq_admin", "1");
    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadAdminPosts();
  } else {
    const err = document.getElementById("loginError");
    err.textContent = "❌ Incorrect password. Try again.";
    document.getElementById("adminPass").value = "";
  }
}

function adminLogout() {
  sessionStorage.removeItem("bq_admin");
  location.reload();
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;

/* ============================
   MEDIA PREVIEW
   ============================ */
let selectedFile = null;

window.previewMedia = function (input) {
  const file = input.files[0];
  if (!file) return;
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const isVideo = file.type.startsWith("video");
    const preview = document.getElementById("mediaPreview");
    preview.style.display = "block";
    preview.innerHTML = isVideo
      ? `<video src="${e.target.result}" controls class="post-media-preview"></video>`
      : `<img src="${e.target.result}" class="post-media-preview" alt="Preview" />`;
    document.getElementById("mediaUploadBox").classList.add("has-media");
  };
  reader.readAsDataURL(file);
};

/* ============================
   UPLOAD TO CLOUDINARY
   ============================ */
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return { url: data.secure_url, type: file.type.startsWith("video") ? "video" : "image" };
}

/* ============================
   PUBLISH POST
   ============================ */
window.publishPost = async function () {
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();
  const status = document.getElementById("publishStatus");
  const btn = document.querySelector(".admin-form-card .submit-btn");

  if (!title) { status.style.color = "#c0392b"; status.textContent = "⚠️ Please add a title."; return; }
  if (!content) { status.style.color = "#c0392b"; status.textContent = "⚠️ Please add some content."; return; }

  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> &nbsp;Publishing...`;
  status.style.color = "#555";
  status.textContent = selectedFile ? "⏳ Uploading media..." : "⏳ Saving post...";

  try {
    let mediaUrl = null;
    let mediaType = null;

    if (selectedFile) {
      const uploaded = await uploadToCloudinary(selectedFile);
      mediaUrl = uploaded.url;
      mediaType = uploaded.type;
    }

    await addDoc(postsRef, {
      title,
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      createdAt: Date.now()
    });

    status.style.color = "#2e7d32";
    status.textContent = "✅ Post published successfully!";

    /* Reset */
    document.getElementById("postTitle").value = "";
    document.getElementById("postContent").value = "";
    document.getElementById("mediaFile").value = "";
    document.getElementById("mediaPreview").style.display = "none";
    document.getElementById("mediaPreview").innerHTML = "";
    document.getElementById("mediaUploadBox").classList.remove("has-media");
    selectedFile = null;

    loadAdminPosts();
    setTimeout(() => { status.textContent = ""; }, 3000);

  } catch (err) {
    status.style.color = "#c0392b";
    status.textContent = "❌ Failed to publish. Try again.";
    console.error(err);
  }

  btn.disabled = false;
  btn.innerHTML = `<i class="fas fa-paper-plane"></i> &nbsp;Publish Post`;
};

/* ============================
   LOAD ADMIN POSTS
   ============================ */
async function loadAdminPosts() {
  const list = document.getElementById("adminPostList");
  const none = document.getElementById("adminNoPosts");
  if (!list) return;

  list.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">Loading...</p>`;

  const q = query(postsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) { list.innerHTML = ""; none.style.display = "block"; return; }
  none.style.display = "none";

  list.innerHTML = snap.docs.map(d => {
    const p = d.data();
    return `
      <div class="admin-post-row">
        <div class="admin-post-info">
          ${p.mediaUrl
            ? (p.mediaType === "video"
                ? `<video src="${p.mediaUrl}" class="admin-thumb"></video>`
                : `<img src="${p.mediaUrl}" class="admin-thumb" alt="" />`)
            : `<div class="admin-thumb no-media"><i class="fas fa-file-alt"></i></div>`}
          <div>
            <strong>${p.title}</strong>
            <span>${p.date}</span>
          </div>
        </div>
        <button class="delete-btn" onclick="deletePost('${d.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
  }).join("");
}

/* ============================
   DELETE POST
   ============================ */
window.deletePost = async function (id) {
  if (!confirm("Delete this post?")) return;
  await deleteDoc(doc(db, "blog_posts", id));
  loadAdminPosts();
};

/* ============================
   PUBLIC BLOG – REAL TIME
   ============================ */
function loadPublicPosts() {
  const grid = document.getElementById("blogGrid");
  const none = document.getElementById("noPosts");
  if (!grid) return;

  grid.innerHTML = `<p style="color:#999;grid-column:1/-1;text-align:center;padding:40px;">Loading posts...</p>`;

  const q = query(postsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, snap => {
    if (snap.empty) { grid.innerHTML = ""; none.style.display = "block"; return; }
    none.style.display = "none";

    grid.innerHTML = snap.docs.map(d => {
      const p = d.data();
      return `
        <div class="blog-card" onclick="openLightbox('${d.id}')">
          <div class="blog-card-media">
            ${p.mediaUrl
              ? (p.mediaType === "video"
                  ? `<video src="${p.mediaUrl}" class="blog-media" muted playsinline></video>`
                  : `<img src="${p.mediaUrl}" class="blog-media" alt="${p.title}" />`)
              : `<div class="blog-media-placeholder"><i class="fas fa-feather-alt"></i></div>`}
          </div>
          <div class="blog-card-body">
            <span class="blog-date"><i class="fas fa-calendar-alt"></i> ${p.date}</span>
            <h3 class="blog-title">${p.title}</h3>
            <div class="blog-excerpt-box">
              <p>${p.content.length > 130 ? p.content.slice(0, 130) + "…" : p.content}</p>
            </div>
            <span class="read-more">Read more <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>`;
    }).join("");
  });
}

/* ============================
   LIGHTBOX
   ============================ */
window.openLightbox = async function (id) {
  const snap = await getDocs(postsRef);
  const post = snap.docs.find(d => d.id === id)?.data();
  if (!post) return;

  document.getElementById("lbMedia").innerHTML = post.mediaUrl
    ? (post.mediaType === "video"
        ? `<video src="${post.mediaUrl}" controls class="lb-media"></video>`
        : `<img src="${post.mediaUrl}" class="lb-media" alt="${post.title}" />`)
    : "";

  document.getElementById("lbCaption").innerHTML =
    `<strong>${post.title}</strong><br/><br/>${post.content}`;

  document.getElementById("lightbox").classList.add("active");
  document.body.style.overflow = "hidden";
};

window.closeLightbox = function () {
  const lb = document.getElementById("lightbox");
  const video = lb.querySelector("video");
  if (video) { video.pause(); video.currentTime = 0; }
  lb.classList.remove("active");
  document.body.style.overflow = "";
};

/* ============================
   INIT ON PAGE LOAD
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  /* Admin page */
  const passField = document.getElementById("adminPass");
  if (passField) {
    passField.addEventListener("keydown", e => { if (e.key === "Enter") adminLogin(); });

    if (sessionStorage.getItem("bq_admin") === "1") {
      document.getElementById("loginOverlay").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      loadAdminPosts();
    }
  }

  /* Public blog page */
  if (document.getElementById("blogGrid")) loadPublicPosts();
});

document.addEventListener("keydown", e => { if (e.key === "Escape") window.closeLightbox(); });
