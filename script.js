// ==========================================
// 1. КОНФІГУРАЦІЯ FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "ВАШ_API_KEY",
    authDomain: "site-demo-sensu.firebaseapp.com",
    projectId: "site-demo-sensu",
    storageBucket: "site-demo-sensu.firebasestorage.app",
    messagingSenderId: "ВАШ_ID",
    appId: "ВАШ_APP_ID"
};

// Ініціалізація бази даних
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Імітація поточного користувача (в реальності це береться з авторизації)
const currentUser = "user_rgdvred"; 

// ==========================================
// 2. ОНЛАЙН-СИНХРОНІЗАЦІЯ (Живі слухачі)
// ==========================================

// Слухаємо зміни профілю в реальному часі
db.collection("users").doc(currentUser).onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        
        // Оновлюємо інтерфейс даними з сервера
        document.getElementById('profile-nickname').innerText = data.nickname || "Анонім";
        document.getElementById('profile-bio').innerText = data.bio || "";
        
        if (data.avatar) document.getElementById('profile-avatar').src = data.avatar;
        if (data.banner) document.getElementById('profile-banner').src = data.banner;

        // Перевіряємо ключові слова після оновлення біографії
        checkBioForMusicKeywords();
    }
});

// Слухаємо треки в реальному часі
db.collection("tracks").where("author", "==", currentUser).onSnapshot((snapshot) => {
    const tracksList = document.getElementById('tracks-list');
    tracksList.innerHTML = ""; // Очищаємо перед оновленням

    snapshot.forEach((doc) => {
        const trackData = doc.data();
        
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        
        const trackTitle = document.createElement('div');
        trackTitle.className = 'track-title';
        trackTitle.innerText = trackData.title;
        
        const audioPlayer = document.createElement('audio');
        audioPlayer.controls = true;
        audioPlayer.src = trackData.audioUrl;
        
        trackItem.appendChild(trackTitle);
        trackItem.appendChild(audioPlayer);
        tracksList.appendChild(trackItem);
    });
});

// ==========================================
// 3. ФУНКЦІЇ ВІДПРАВКИ НА СЕРВЕР
// ==========================================

// Збереження змін з форми редагування на сервер
function saveProfileChanges() {
    const newNick = document.getElementById('edit-nickname-input').value;
    const newBio = document.getElementById('edit-bio-input').value;
    const socialLink = document.getElementById('edit-social-input').value;

    // Відправляємо в базу замість прямої зміни HTML
    db.collection("users").doc(currentUser).set({
        nickname: newNick.trim(),
        bio: newBio,
        social: socialLink.trim()
    }, { merge: true }).then(() => {
        // Ховаємо панель після успішного збереження
        document.getElementById('edit-panel').style.display = 'none';
    }).catch(err => console.error("Помилка збереження: ", err));
}

// Завантаження фото (Аватар/Банер) на сервер (через Base64 для тесту)
function changeImage(event, elementId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            
            // Визначаємо, що саме оновлюємо
            const updateData = {};
            if (elementId === 'profile-avatar') updateData.avatar = base64Image;
            if (elementId === 'profile-banner') updateData.banner = base64Image;

            // Відправляємо в базу
            db.collection("users").doc(currentUser).set(updateData, { merge: true });
        };
        reader.readAsDataURL(file);
    }
}

// Функція завантаження треку на сервер
function uploadTrack(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Audio = e.target.result;
            
            // Відправляємо трек у колекцію tracks
            db.collection("tracks").add({
                author: currentUser,
                title: file.name,
                audioUrl: base64Audio,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            event.target.value = ''; // Очищуємо інпут
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// 4. ІНТЕРФЕЙСНІ ФУНКЦІЇ (UI - без сервера)
// ==========================================

const MUSIC_KEYWORDS = ["музика", "музикант", "співак", "співачка", "музикантка"];

function checkBioForMusicKeywords() {
    const bioText = document.getElementById('profile-bio').innerText.toLowerCase();
    const tracksTabBtn = document.getElementById('tab-tracks-btn');
    const hasKeyword = MUSIC_KEYWORDS.some(keyword => bioText.includes(keyword));

    if (hasKeyword) {
        tracksTabBtn.style.display = 'block';
    } else {
        tracksTabBtn.style.display = 'none';
        if (tracksTabBtn.classList.contains('active')) {
            switchTab('publications');
        }
    }
}

function toggleEditPanel() {
    const panel = document.getElementById('edit-panel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        document.getElementById('edit-nickname-input').value = document.getElementById('profile-nickname').innerText;
        document.getElementById('edit-bio-input').value = document.getElementById('profile-bio').innerText;
    }
}

function switchTab(tabName) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    if (tabName === 'publications') {
        document.getElementById('tab-publications').classList.add('active');
        buttons[0].classList.add('active');
    } else if (tabName === 'reposts') {
        document.getElementById('tab-reposts').classList.add('active');
        buttons[1].classList.add('active');
    } else if (tabName === 'tracks') {
        document.getElementById('tab-tracks').classList.add('active');
        document.getElementById('tab-tracks-btn').classList.add('active');
    }
}

function openModal(modalId) { document.getElementById(modalId).style.display = 'block'; }
function closeModal(event, modalId) {
    if (event.target === document.getElementById(modalId)) {
        document.getElementById(modalId).style.display = 'none';
    }
}

function logout() {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-size:24px;'>Ви вийшли з системи. Перезавантажте сторінку.</div>";
}