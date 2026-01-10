/* logic.js */

// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE88FW3US3aZRn5TLEdXkad-jvak3W4yI",
  authDomain: "sahantechhub.firebaseapp.com",
  projectId: "sahantechhub",
  storageBucket: "sahantechhub.firebasestorage.app",
  messagingSenderId: "605792804808",
  appId: "1:605792804808:web:531be19ce5f6a4a17faafd",
  measurementId: "G-JMSXWQ964T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// CRITICAL: DATA ISOLATION NAMESPACE
const SITE_COLLECTION = 'sites/newflowers_official';

// --- Default English Content (Fallback) ---
const defaultContent = {
    hero: {
        title: "Building Dreams, Engineering Reality",
        subtitle: "Sri Lanka's Premier Construction Partner with 25 Years of Trust.",
        bgImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    },
    about: {
        text: "With over 25 years of experience, we are leaders in the construction field. We specialize in UDA regulation-compliant designs, Vastu Vidya, and modern architecture.",
        mission: "To provide standardized, high-quality construction solutions.",
        vision: "To be the most trusted name in Sri Lankan infrastructure."
    }
};

// --- Page Loader Logic ---
async function loadContent(sectionName, elementIds) {
    try {
        const doc = await db.collection(SITE_COLLECTION).doc(sectionName).get();
        if (doc.exists) {
            const data = doc.data();
            for (const [key, id] of Object.entries(elementIds)) {
                if(document.getElementById(id)) {
                    if (key.includes('Image') || key.includes('Src')) {
                        document.getElementById(id).src = data[key];
                    } else {
                        document.getElementById(id).innerText = data[key];
                    }
                }
            }
        } else {
            console.log(`No data for ${sectionName}, utilizing defaults or waiting for admin input.`);
            // Apply defaults if available
            if(defaultContent[sectionName]) {
                 for (const [key, id] of Object.entries(elementIds)) {
                     if(document.getElementById(id)) document.getElementById(id).innerText = defaultContent[sectionName][key];
                 }
            }
        }
    } catch (error) {
        console.error("Error loading content:", error);
    }
}

// --- Dynamic Grid Loader (Projects/Designs/Reviews) ---
async function loadGrid(collectionName, containerId, templateFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const snapshot = await db.collection(SITE_COLLECTION).collection(collectionName).get();
        container.innerHTML = '';
        if(snapshot.empty) {
            container.innerHTML = '<p>Content coming soon.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            container.innerHTML += templateFunc(data, doc.id);
        });
    } catch (e) {
        console.error(e);
    }
}

// --- Chat Bot Logic ---
function initChatBot() {
    const chatBtn = document.querySelector('.chatbot-toggler');
    const chatWindow = document.querySelector('.chatbot-window');
    const input = document.querySelector('.chat-input input');
    const body = document.querySelector('.chat-body');

    if(!chatBtn) return;

    chatBtn.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
    });

    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && input.value.trim() !== '') {
            let userMsg = input.value.trim();
            addMsg(userMsg, 'user');
            input.value = '';
            
            // Artificial delay
            setTimeout(() => {
                botResponse(userMsg);
            }, 600);
        }
    });

    function addMsg(text, type) {
        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;
        div.innerText = text;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function botResponse(msg) {
        msg = msg.toLowerCase();
        let response = "";
        
        if(msg.includes('price') || msg.includes('cost') || msg.includes('boq')) {
            response = "We provide custom BOQ estimates. Prices vary based on design. Shall we schedule a consultation?";
        } else if (msg.includes('location') || msg.includes('address')) {
            response = "We are located at 126/1/1, Court Road, Homagama.";
        } else if (msg.includes('contact') || msg.includes('phone')) {
            response = "Call us at 077 787 7204 or 011 720 3140.";
        } else if (msg.includes('design') || msg.includes('plan')) {
            response = "We do 3D Designs, Vastu Plans, and UDA compliant drawings.";
        } else {
            // Fallback
            response = "I might need a human to answer that properly. Connect with us on WhatsApp?";
            setTimeout(() => {
                const waBtn = document.createElement('a');
                waBtn.href = "https://wa.me/94777877204";
                waBtn.className = "btn";
                waBtn.style.fontSize = "0.8rem";
                waBtn.style.marginTop = "5px";
                waBtn.innerText = "Open WhatsApp";
                waBtn.target = "_blank";
                body.appendChild(waBtn);
                body.scrollTop = body.scrollHeight;
            }, 100);
        }
        addMsg(response, 'bot');
    }
}

// --- Contact Form ---
async function submitContact(e) {
    e.preventDefault();
    const name = document.getElementById('c-name').value;
    const msg = document.getElementById('c-msg').value;
    const phone = document.getElementById('c-phone').value;
    
    await db.collection(SITE_COLLECTION).collection('messages').add({
        name, phone, msg, date: new Date().toISOString()
    });
    
    alert("Message sent! We will contact you shortly.");
    e.target.reset();
}

// --- Initialize Index ---
if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', () => {
        loadContent('hero', {title: 'hero-title', subtitle: 'hero-desc'});
        loadContent('about', {text: 'about-text', mission: 'mission-text', vision: 'vision-text'});
        
        // Template for Projects
        const projectTemplate = (data) => `
            <div class="card">
                <img src="${data.image || 'https://via.placeholder.com/300'}" alt="${data.title}">
                <h4>${data.title}</h4>
                <p>${data.desc}</p>
            </div>
        `;
        
        loadGrid('new_designs', 'designs-grid', projectTemplate);
        loadGrid('completed_projects', 'completed-grid', projectTemplate);
        loadGrid('reviews', 'reviews-grid', (data) => `<div class="card"><p>"${data.text}"</p><strong>- ${data.user}</strong></div>`);
        
        initChatBot();
        
        const contactForm = document.getElementById('contact-form');
        if(contactForm) contactForm.addEventListener('submit', submitContact);
    });
}
