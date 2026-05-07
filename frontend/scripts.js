const API_BASE = 'https://tarun-mayank-3.onrender.com'; // backend server
const toggleButton = document.getElementById('toggleFilters');  // store the element in variable
const advancedFilters = document.getElementById('advancedFilters');
const loginButton = document.getElementById('loginButton');
const closeLogin = document.getElementById('closeLogin');
const loginModal = document.getElementById('loginModal');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const authActionBtn = document.getElementById('authActionBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authOptionsRow = document.getElementById('authOptionsRow');
const loginStatus = document.getElementById('loginStatus');

let authMode = 'login';  // store current auth tab
const botButton = document.getElementById('botButton');
const searchInput = document.getElementById('searchInput');
const locationInput = document.getElementById('locationInput');
const categorySelect = document.getElementById('categorySelect');
const fullTimeCheckbox = document.getElementById('filterFullTime');
const remoteCheckbox = document.getElementById('filterRemote');
const internshipCheckbox = document.getElementById('filterInternship');
const jobSearchButton = document.getElementById('jobSearchButton');
const jobsList = document.getElementById('jobsList');
const noJobsMsg = document.getElementById('noJobsMsg');

// Post Job Elements
const postJobOpenBtn = document.getElementById('postJobOpenBtn');
const postJobModal = document.getElementById('postJobModal');
const closePostJob = document.getElementById('closePostJob');
const pjTitle = document.getElementById('pjTitle');
const pjCompany = document.getElementById('pjCompany');
const pjLocation = document.getElementById('pjLocation');
const pjSalary = document.getElementById('pjSalary');
const pjCategory = document.getElementById('pjCategory');
const pjLink = document.getElementById('pjLink');
const pjSubmitBtn = document.getElementById('pjSubmitBtn');
const pjStatus = document.getElementById('pjStatus');

// Chat UI Elements
const chatSidebar = document.getElementById('chatSidebar');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const chatHistory = document.getElementById('chatHistory');
const openAiRoadmap = document.getElementById('openAiRoadmap');

// Resume Upload Elements
const resumeUpload = document.getElementById('resumeUpload');
const resumeAttachment = document.getElementById('resumeAttachment');
const resumeName = document.getElementById('resumeName');
const removeResume = document.getElementById('removeResume');
let currentResumeContext = "";

// Chat Sizing & Controls
const sizeSmallBtn = document.getElementById('sizeSmallBtn');
const sizeMediumBtn = document.getElementById('sizeMediumBtn');
const sizeLargeBtn = document.getElementById('sizeLargeBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const stopGeneration = document.getElementById('stopGeneration');
const stopGenBtn = document.getElementById('stopGenBtn');
let abortTypewriter = false;
let isGenerating = false;

let chatMessages = [];  // store chat history

let currentJobs = [];  // store currently displayed jobs

// load jobs from backened with current filters
async function loadJobs() {
    if (!jobsList) return; 

    jobsList.innerHTML = '<p class="loading-text">Loading jobs...</p>';
    if (noJobsMsg) noJobsMsg.classList.add('hidden');

    try {
        const keyword = searchInput?.value.trim() || "";
        const location = locationInput?.value.trim() || "";
        const category = categorySelect?.value || "All Categories";
        const fullTime = fullTimeCheckbox?.checked || false;
        const remote = remoteCheckbox?.checked || false;
        const internship = internshipCheckbox?.checked || false;
        
        const url = `${API_BASE}/api/jobs/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}&fullTime=${fullTime}&remote=${remote}&internship=${internship}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load jobs');
        }

        const data = await response.json();
        currentJobs = data.jobs || [];
        renderJobs(currentJobs);
    } catch (error) {
        jobsList.innerHTML = `<p class="error-text">Unable to fetch jobs from backend. Make sure the backend is running.</p>`;
        console.error(error);
    }
}

// display the jobs on the page
function renderJobs(jobs) {
    if (!jobsList) return;

    if (jobs.length === 0) {
        jobsList.innerHTML = '';
        if (noJobsMsg) noJobsMsg.classList.remove('hidden');
        return;
    }

    if (noJobsMsg) noJobsMsg.classList.add('hidden');

    jobsList.innerHTML = jobs
        .map(job => `
            <article class="job-card">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                    </div>
                    <span class="job-date">${job.postedDate || 'Recently'}</span>
                </div>
                <div class="job-body">
                    <p class="job-role">Role: <strong>${job.title}</strong></p>
                    <p class="job-company-name">Company: <strong>${job.company}</strong></p>
                    <p class="job-location">Location: <strong>${job.location || 'Any'}</strong></p>
                    <p class="job-salary">Salary: <strong>${job.salary || 'Not specified'}</strong></p>
                    ${job.source ? `<p class="job-source">Source: <strong>${job.source}</strong></p>` : ''}
                </div>
                <div class="job-actions">
                    <a class="apply-link" href="${job.link || '#'}" target="_blank">Apply Now</a>
                    <button class="delete-job-btn" onclick="deleteJob('${job.id}')">Delete</button>
                </div>
            </article>
        `)
        .join('');
}

async function deleteJob(jobId) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete job');
        loadJobs();
    } catch (error) {
        console.error("Error deleting job:", error);
        alert("Failed to delete job. Check console.");
    }
}

if (authTabs) {
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            authTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            authMode = e.target.getAttribute('data-tab');

            if (authMode === 'login') {
                authTitle.innerHTML = '<span class="icon-uniform">🔐</span> Welcome Back';
                authSubtitle.textContent = 'Sign in to manage your job search and saved opportunities.';
                authActionBtn.textContent = 'Sign In';
                if(authOptionsRow) authOptionsRow.classList.remove('hidden');
            } else {
                authTitle.innerHTML = '<span class="icon-uniform">✨</span> Create Account';
                authSubtitle.textContent = 'Join thousands of professionals finding their dream jobs.';
                authActionBtn.textContent = 'Sign Up';
                if(authOptionsRow) authOptionsRow.classList.add('hidden');
            }
            if(loginStatus) loginStatus.textContent = '';
        });
    });
}

async function handleAuthAction() {
    if (!loginEmail || !loginPassword || !loginStatus) return;

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        loginStatus.textContent = 'Please enter both email and password.';
        loginStatus.classList.add('error-text');
        return;
    }

    loginStatus.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';
    loginStatus.classList.remove('error-text');

    const endpoint = authMode === 'login' ? '/login' : '/register';

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Authentication failed');
        }

        const data = await response.json();
        
        // Save the JWT token
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
        }

        loginStatus.textContent = data.message || 'Success!';
        loginStatus.classList.remove('error-text');
        loginStatus.classList.add('success-text');

        setTimeout(() => {
            loginModal.classList.add('hidden');
            loginStatus.textContent = '';
            loginStatus.classList.remove('success-text');
            if (loginButton) {
                loginButton.innerHTML = '<span class="icon-uniform">👋</span>Logout';
            }
        }, 1500);
    } catch (error) {
        loginStatus.textContent = error.message;
        loginStatus.classList.add('error-text');
    }
}

async function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (loginButton) {
                    loginButton.innerHTML = '<span class="icon-uniform">👋</span>Logout';
                }
            } else {
                localStorage.removeItem('access_token');
                if (loginButton) {
                    loginButton.innerHTML = '<span class="icon-uniform">🔐</span>Login';
                }
            }
        } catch (error) {
            console.error("Auth check failed", error);
            if (loginButton) {
                loginButton.innerHTML = '<span class="icon-uniform">🔐</span>Login';
            }
        }
    }
}

if (toggleButton && advancedFilters) {
    toggleButton.addEventListener('click', () => {
        advancedFilters.classList.toggle('hidden');
        const arrow = toggleButton.querySelector('.arrow');
        if (arrow) {
            arrow.textContent = advancedFilters.classList.contains('hidden') ? '▾' : '▴';
        }
    });
}

if (loginButton && loginModal) {
    loginButton.addEventListener('click', () => {
        if (localStorage.getItem('access_token')) {
            // Logout
            localStorage.removeItem('access_token');
            loginButton.innerHTML = '<span class="icon-uniform">🔐</span>Login';
            alert('Logged out successfully.');
        } else {
            loginModal.classList.remove('hidden');
        }
    });
}

if (closeLogin && loginModal) {
    closeLogin.addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });
}

if (loginModal) {
    loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.classList.add('hidden');
        }
    });
}

if (botButton && chatSidebar) {
    botButton.addEventListener('click', () => {
        chatSidebar.classList.remove('hidden');
        chatInput?.focus();
    });
}

if (closeChat && chatSidebar) {
    closeChat.addEventListener('click', () => {
        chatSidebar.classList.add('hidden');
    });
}

function setChatSize(size, activeBtn) {
    if (!chatSidebar) return;
    chatSidebar.classList.remove('size-small', 'size-medium', 'size-large');
    chatSidebar.classList.add(size);
    
    [sizeSmallBtn, sizeMediumBtn, sizeLargeBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
}

if (sizeSmallBtn) sizeSmallBtn.addEventListener('click', () => setChatSize('size-small', sizeSmallBtn));
if (sizeMediumBtn) sizeMediumBtn.addEventListener('click', () => setChatSize('size-medium', sizeMediumBtn));
if (sizeLargeBtn) sizeLargeBtn.addEventListener('click', () => setChatSize('size-large', sizeLargeBtn));

if (openAiRoadmap && chatSidebar) {
    openAiRoadmap.addEventListener('click', () => {
        chatSidebar.classList.remove('hidden');
        if (chatInput) {
            chatInput.value = "Can you provide a structured interview roadmap and DSA resources for me?";
            handleSendChat();
        }
    });
}

// Basic markdown parser
function parseMarkdown(text) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

async function typewriterEffect(element, htmlString, speed = 15) {
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    async function typeNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            let currentText = '';
            const textNode = document.createTextNode('');
            element.insertBefore(textNode, cursor);
            
            for (let i = 0; i < text.length; i++) {
                if (abortTypewriter) return true;
                currentText += text[i];
                textNode.textContent = currentText;
                if (chatHistory) chatHistory.scrollTop = chatHistory.scrollHeight;
                
                const randomDelay = speed + (Math.random() * 10 - 5);
                await new Promise(resolve => setTimeout(resolve, randomDelay));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            element.insertBefore(clone, cursor);
            
            if (node.childNodes.length > 0) {
                const oldParent = element;
                element = clone;
                element.appendChild(cursor);
                
                for (const child of Array.from(node.childNodes)) {
                    if (await typeNode(child)) return true;
                }
                
                element = oldParent;
                element.appendChild(cursor);
            }
        }
    }
    
    for (const child of Array.from(tempDiv.childNodes)) {
        if (await typeNode(child)) break;
    }
    
    abortTypewriter = false;
    cursor.remove();
}

function appendMessage(role, text, attachedFileName = null) {
    if (!chatHistory) return null;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    
    if (attachedFileName) {
        const fileBadge = document.createElement('div');
        fileBadge.className = 'chat-attached-file';
        fileBadge.innerHTML = `<span class="icon-uniform" style="color: #ef4444;">📄</span> <strong>${attachedFileName}</strong>`;
        bubble.appendChild(fileBadge);
    }
    
    const textDiv = document.createElement('div');
    if (role === 'bot') {
        // Handled by typewriter
    } else {
        textDiv.textContent = text;
    }
    bubble.appendChild(textDiv);
    
    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return textDiv;
}

function appendTypingIndicator() {
    if (!chatHistory) return null;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message bot typing-msg`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble typing-indicator';
    bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return msgDiv;
}

async function handleSendChat() {
    if (!chatInput || !chatInput.value.trim()) return;
    
    const text = chatInput.value.trim();
    chatInput.value = '';
    
    isGenerating = true;
    abortTypewriter = false;
    if (stopGeneration) stopGeneration.classList.remove('hidden');
    
    let fileName = null;
    if (currentResumeContext && resumeName && resumeName.textContent && resumeName.textContent !== "Uploading..." && resumeName.textContent !== "Upload failed") {
        fileName = resumeName.textContent;
    }

    appendMessage('user', text, fileName);
    chatMessages.push({ role: 'user', content: text });
    
    const indicator = appendTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                history: chatMessages.slice(0, -1),
                resume_context: currentResumeContext
            })
        });
        
        // Clear attachment UI after sending so it only applies to this message
        currentResumeContext = "";
        if (resumeAttachment) resumeAttachment.classList.add('hidden');
        
        if (indicator) indicator.remove();
        
        if (!response.ok) {
            const bubble = appendMessage('bot', '');
            bubble.textContent = 'Sorry, I am having trouble connecting to the server right now.';
            return;
        }
        
        const data = await response.json();
        const reply = data.reply || "No response";
        
        const botBubble = appendMessage('bot', '');
        const parsedHtml = parseMarkdown(reply);
        await typewriterEffect(botBubble, parsedHtml, 15);
        
        chatMessages.push({ role: 'assistant', content: reply });
        
    } catch (error) {
        if (indicator) indicator.remove();
        const bubble = appendMessage('bot', '');
        bubble.textContent = 'Error: Could not reach the backend API.';
        console.error(error);
    } finally {
        isGenerating = false;
        abortTypewriter = false;
        if (stopGeneration) stopGeneration.classList.add('hidden');
    }
}

if (sendChat) {
    sendChat.addEventListener('click', handleSendChat);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChat();
        }
    });
}

if (resumeUpload) {
    resumeUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        resumeName.textContent = "Uploading...";
        resumeAttachment.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/api/upload_resume`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            currentResumeContext = data.text;
            resumeName.textContent = file.name;
        } catch (error) {
            console.error("Resume upload error:", error);
            resumeName.textContent = "Upload failed";
            setTimeout(() => resumeAttachment.classList.add('hidden'), 2000);
        }
        
        resumeUpload.value = ''; // Reset input
    });
}

if (removeResume) {
    removeResume.addEventListener('click', () => {
        currentResumeContext = "";
        resumeAttachment.classList.add('hidden');
    });
}

if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the chat history?")) {
            chatMessages = [];
            if (chatHistory) {
                chatHistory.innerHTML = `
                    <div class="chat-message bot">
                        <div class="chat-bubble">
                            Hi! I'm your AI Interview Preparation Assistant. Let's start fresh. How can I help you today?
                        </div>
                    </div>`;
            }
            if (isGenerating) {
                abortTypewriter = true;
            }
        }
    });
}

if (stopGenBtn) {
    stopGenBtn.addEventListener('click', () => {
        if (isGenerating) {
            abortTypewriter = true;
        }
    });
}

if (jobSearchButton) {
    jobSearchButton.addEventListener('click', loadJobs);
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchInput.timer);
        searchInput.timer = setTimeout(loadJobs, 500);
    });
}

if (locationInput) {
    locationInput.addEventListener('input', () => {
        clearTimeout(locationInput.timer);
        locationInput.timer = setTimeout(loadJobs, 500);
    });
}

if (categorySelect) {
    categorySelect.addEventListener('change', loadJobs);
}

if (fullTimeCheckbox) {
    fullTimeCheckbox.addEventListener('change', loadJobs);
}

if (remoteCheckbox) {
    remoteCheckbox.addEventListener('change', loadJobs);
}

if (internshipCheckbox) {
    internshipCheckbox.addEventListener('change', loadJobs);
}

if (postJobOpenBtn && postJobModal) {
    postJobOpenBtn.addEventListener('click', () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Please login to post a job.');
            if (loginModal) loginModal.classList.remove('hidden');
            return;
        }
        postJobModal.classList.remove('hidden');
    });
}

if (closePostJob && postJobModal) {
    closePostJob.addEventListener('click', () => {
        postJobModal.classList.add('hidden');
    });
}

if (postJobModal) {
    postJobModal.addEventListener('click', (event) => {
        if (event.target === postJobModal) {
            postJobModal.classList.add('hidden');
        }
    });
}

async function handlePostJob() {
    if (!pjTitle || !pjCompany || !pjLocation || !pjLink) return;
    
    if (!pjTitle.value || !pjCompany.value || !pjLocation.value || !pjLink.value) {
        if(pjStatus) {
            pjStatus.textContent = 'Please fill out all required fields.';
            pjStatus.classList.add('error-text');
        }
        return;
    }
    
    if(pjStatus) {
        pjStatus.textContent = 'Posting...';
        pjStatus.classList.remove('error-text');
    }
    
    const newJob = {
        title: pjTitle.value.trim(),
        company: pjCompany.value.trim(),
        location: pjLocation.value.trim(),
        salary: pjSalary ? pjSalary.value.trim() : "Not specified",
        category: pjCategory ? pjCategory.value : "General",
        link: pjLink.value.trim(),
        description: "Manually posted job"
    };

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error("You must be logged in to post a job.");
        }
        const response = await fetch(`${API_BASE}/api/jobs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newJob)
        });

        if (!response.ok) {
            let errorMsg = 'Failed to post job';
            try {
                const errorData = await response.json();
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }

        if(pjStatus) {
            pjStatus.textContent = 'Job posted successfully!';
            pjStatus.classList.remove('error-text');
            pjStatus.classList.add('success-text');
        }

        setTimeout(() => {
            if(postJobModal) postJobModal.classList.add('hidden');
            if(pjStatus) {
                pjStatus.textContent = '';
                pjStatus.classList.remove('success-text');
            }
            // Reset form
            pjTitle.value = ''; pjCompany.value = ''; pjLocation.value = ''; 
            if(pjSalary) pjSalary.value = ''; 
            pjLink.value = '';
            loadJobs(); // refresh the list
        }, 1500);
    } catch (error) {
        if(pjStatus) {
            pjStatus.textContent = error.message;
            pjStatus.classList.add('error-text');
        }
    }
}

if (pjSubmitBtn) {
    pjSubmitBtn.addEventListener('click', handlePostJob);
}

if (authActionBtn) {
    authActionBtn.type = 'button';
    authActionBtn.addEventListener('click', handleAuthAction);
}

if (loginEmail) {
    loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAuthAction();
        }
    });
}

if (loginPassword) {
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAuthAction();
        }
    });
}

checkAuthStatus();
loadJobs();
