document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'home.html';
        return;
    }
    if (currentUser.role === 'recruiter') {
        window.location.href = 'recruiter-dashboard.html';
        return;
    }
    const headerTitleP = document.querySelector('.header-title p');
    if (headerTitleP && currentUser.firstName) {
        headerTitleP.textContent = `Welcome back, ${currentUser.firstName}! Here's your recruitment overview.`;
    }
    if (!currentUser.dashboard) {
        currentUser.dashboard = {
            totalResumes: 0,
            shortlisted: 0,
            avgScore: 0,
            recentActivity: []
        };
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let uIndex = users.findIndex(u => u.email === currentUser.email);
        if (uIndex > -1) { users[uIndex] = currentUser; localStorage.setItem('users', JSON.stringify(users)); }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    function renderDashboard() {
        const statResumes = document.getElementById('stat-resumes');
        if (statResumes) {
            statResumes.textContent = currentUser.dashboard.totalResumes;
            document.getElementById('stat-shortlisted').textContent = currentUser.dashboard.shortlisted;
            document.getElementById('stat-avg-score').textContent = currentUser.dashboard.avgScore + '%';
            const actContainer = document.getElementById('recent-activity-container');
            if (currentUser.dashboard.recentActivity.length === 0) {
                actContainer.innerHTML = `<div class="empty-state" style="text-align: center; margin-top: 30px;"><i class="fa-solid fa-clock empty-icon" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 10px; display: block;"></i><p style="color: var(--text-secondary);">No recent activity</p></div>`;
            } else {
                actContainer.innerHTML = '';
                currentUser.dashboard.recentActivity.forEach(act => {
                    actContainer.innerHTML += `<div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                         <p style="font-size: 0.95rem; font-weight: 500; color: var(--text-primary); margin-bottom: 3px;">${act.message}</p>
                         <span style="font-size: 0.8rem; color: var(--text-secondary);">${act.time}</span>
                     </div>`;
                });
            }
        }
    }
    renderDashboard();
    const profileMenu = document.querySelector('.profile-menu');
    if (profileMenu) {
        profileMenu.innerHTML = `
            <span class="profile-link" style="margin-right: 15px; font-weight: 500;">
                <i class="fa-solid fa-user-circle" style="font-size: 1.2rem; margin-right: 5px;"></i> 
                ${currentUser.firstName} ${currentUser.lastName}
            </span>
            <a href="#" id="logout-btn" class="profile-btn" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.5);">Logout</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'home.html';
        });
    }
    let windowJobs = [];
    async function initializeRecommendations() {
        try {
            const response = await fetch('http://localhost:8000/api/jobs');
            if (response.ok) {
                const data = await response.json();
                windowJobs = data.jobs;
                if (!currentUser.dashboard.lastRecs || currentUser.dashboard.lastRecs.length === 0) {
                    currentUser.dashboard.lastRecs = windowJobs;
                }
                renderSidebarRecs(3);
            }
        } catch (e) {
            console.error("Could not load recommendations", e);
        }
    }
    initializeRecommendations();
    function renderSidebarRecs(limit = null) {
        const recList = document.getElementById('recommendation-list');
        const viewAllBtn = document.getElementById('view-all-recs-btn');
        if (!recList) return;
        let displayJobs = currentUser.dashboard.lastRecs || windowJobs;
        if (limit && limit < displayJobs.length) {
            displayJobs = displayJobs.slice(0, limit);
            if (viewAllBtn) viewAllBtn.style.display = 'inline-block';
        } else {
            if (viewAllBtn) viewAllBtn.style.display = 'none';
        }
        let html = '';
        displayJobs.forEach(job => {
            let tag = job.skills && job.skills.length > 0 ? job.skills[0] : 'General';
            let badgeClass = tag.toLowerCase().includes('design') ? 'badge-design' : 'badge-programming';
            let scoreTag = job.match_score ? `<span style="float: right; color: var(--match-high); font-weight: bold; font-size: 0.8rem;">${job.match_score}% Match</span>` : '';
            html += `<div class="rec-item">
                <h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 5px;">${job.title} ${scoreTag}</h4>
                <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95%; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">${job.description}</p>
                <span class="badge ${badgeClass}">${tag}</span>
            </div>`;
        });
        recList.innerHTML = html;
    }
    const viewAllBtn = document.getElementById('view-all-recs-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderSidebarRecs(null);
        });
    }
    const dropArea = document.getElementById('drop-area');
    const browseBtn = document.getElementById('browse-btn');
    const resumeInput = document.getElementById('resume-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const submitBtn = document.getElementById('submit-btn');
    const uploadForm = document.getElementById('upload-form');
    const loader = document.getElementById('loader');
    const resultsSection = document.getElementById('results-section');
    const navDashboard = document.getElementById('nav-dashboard');
    const navJobs = document.getElementById('nav-jobs');
    const navCandidates = document.getElementById('nav-candidates');
    const dashboardView = document.getElementById('dashboard-view');
    const jobsView = document.getElementById('jobs-view');
    const candidatesView = document.getElementById('candidates-view');
    const allJobsGrid = document.getElementById('all-jobs-grid');
    function switchView(viewId) {
        [dashboardView, jobsView, candidatesView].forEach(view => view.classList.add('hidden'));
        [navDashboard, navJobs, navCandidates].forEach(nav => nav.classList.remove('active'));
        if (viewId === 'dashboard') {
            dashboardView.classList.remove('hidden');
            navDashboard.classList.add('active');
        } else if (viewId === 'jobs') {
            jobsView.classList.remove('hidden');
            navJobs.classList.add('active');
            fetchAllJobs();
        } else if (viewId === 'candidates') {
            candidatesView.classList.remove('hidden');
            navCandidates.classList.add('active');
            renderAppliedJobs();
        }
    }
    function renderAppliedJobs() {
        const list = document.getElementById('applied-jobs-list');
        if (!list) return;
        const allApplications = JSON.parse(localStorage.getItem('applications')) || [];
        const myApps = allApplications.filter(app => app.candidateEmail === currentUser.email);
        if (myApps.length === 0) {
            list.innerHTML = `
                <div class="card" style="text-align: center; padding: 40px;">
                    <i class="fa-solid fa-inbox" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 10px;"></i>
                    <p style="color: var(--text-secondary);">You haven't applied for any jobs yet.</p>
                </div>
            `;
            return;
        }
        let html = '<div class="jobs-grid">';
        myApps.forEach(app => {
            html += `
                <div class="job-card glass-panel">
                    <div class="job-header">
                        <div class="job-title">${app.jobTitle}</div>
                        <div class="match-score score-high">${app.matchScore}</div>
                    </div>
                    <div class="job-company" style="font-weight: 500; color: var(--primary-color); margin-bottom: 5px;">${app.company || 'Unknown Company'}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">Applied on: ${app.date}</div>
                    <div style="font-size: 0.9rem;">Resume: ${app.resumeFile}</div>
                    <button class="btn-outline-primary mt-3" style="width: 100%;" disabled>Application Under Review</button>
                </div>
            `;
        });
        html += '</div>';
        list.innerHTML = html;
    }
    navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    navJobs.addEventListener('click', (e) => { e.preventDefault(); switchView('jobs'); });
    navCandidates.addEventListener('click', (e) => { e.preventDefault(); switchView('candidates'); });
    async function fetchAllJobs() {
        allJobsGrid.innerHTML = '<div class="loader"><div class="spinner"></div><p>Loading all jobs...</p></div>';
        try {
            const response = await fetch('http://localhost:8000/api/jobs');
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            displayAllJobs(data.jobs);
        } catch (error) {
            allJobsGrid.innerHTML = `<p style="color: var(--match-low);">Error loading jobs: ${error.message}</p>`;
        }
    }
    function getJobCompany(jobId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const recruiters = users.filter(u => u.role === 'recruiter' && u.company);
        let companies = recruiters.map(u => u.company);
        if (companies.length === 0) companies = ['Acme Corp', 'Tech Solutions', 'Global AI'];
        companies = [...new Set(companies)];
        const numId = parseInt(jobId) || Math.floor(Math.random() * companies.length);
        return companies[numId % companies.length];
    }
    function displayAllJobs(jobs) {
        allJobsGrid.innerHTML = '';
        if (!jobs || jobs.length === 0) {
            allJobsGrid.innerHTML = '<p>No jobs available at the moment.</p>';
            return;
        }
        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'job-card glass-panel';
            const hasLongDesc = job.description && job.description.length > 100;
            card.innerHTML = `
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">ID: ${job.id}</div>
                </div>
                <div class="job-company" style="font-weight: 500; color: var(--primary-color); font-size: 0.9rem; margin-bottom: 5px;">${getJobCompany(job.id)}</div>
                <div class="job-desc">${job.description}</div>
                ${hasLongDesc ? '<span class="view-more-link">View More</span>' : ''}
                <div class="job-skills">
                    ${job.skills.map(skill => `<span class="job-skill">${skill}</span>`).join('')}
                </div>
                <button class="btn-apply">View & Apply</button>
            `;
            allJobsGrid.appendChild(card);
        });
    }
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });
    dropArea.addEventListener('drop', handleDrop, false);
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            resumeInput.files = files;
            updateFileName(files[0].name);
        }
    }
    browseBtn.addEventListener('click', () => {
        resumeInput.click();
    });
    resumeInput.addEventListener('change', function () {
        if (this.files.length) {
            updateFileName(this.files[0].name);
        }
    });
    function updateFileName(name) {
        if (name.toLowerCase().endsWith('.pdf')) {
            fileNameDisplay.textContent = name;
            submitBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = 'Please select a PDF file.';
            submitBtn.disabled = true;
        }
    }
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!resumeInput.files.length) return;
        const file = resumeInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        submitBtn.disabled = true;
        loader.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        try {
            const response = await fetch('http://localhost:8000/api/upload_resume', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errResult = await response.json();
                throw new Error(errResult.detail || 'An error occurred during parsing.');
            }
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            alert('Error: ' + error.message + '\nMake sure the backend is running on http://localhost:8000');
        } finally {
            submitBtn.disabled = false;
            loader.classList.add('hidden');
        }
    });
    function displayResults(data) {
        document.getElementById('candidate-filename').textContent = data.candidate_info.filename;
        const atsBadge = document.getElementById('ats-score-badge');
        const atsValue = document.getElementById('ats-score-value');
        const score = data.candidate_info.ats_score || 0;
        atsValue.textContent = score;
        if (score >= 75) {
            atsBadge.style.background = '#dcfce7'; atsBadge.style.color = '#166534';
        } else if (score >= 40) {
            atsBadge.style.background = '#fef9c3'; atsBadge.style.color = '#854d0e';
        } else {
            atsBadge.style.background = '#fee2e2'; atsBadge.style.color = '#991b1b';
        }
        const feedbackCard = document.getElementById('ats-feedback-card');
        const jobsSection = document.getElementById('jobs-matching-section');
        if (score < 40) {
            feedbackCard.classList.remove('hidden');
            jobsSection.classList.add('hidden');
        } else {
            feedbackCard.classList.add('hidden');
            jobsSection.classList.remove('hidden');
        }
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = '';
        if (data.candidate_info.extracted_skills.length) {
            data.candidate_info.extracted_skills.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'skill-badge';
                span.textContent = skill;
                skillsContainer.appendChild(span);
            });
        } else {
            skillsContainer.innerHTML = '<p>No specific core skills strongly identified.</p>';
        }
        const jobsGrid = document.getElementById('jobs-grid');
        jobsGrid.innerHTML = '';
        data.matched_jobs.forEach(job => {
            const matchClass = job.match_score >= 70 ? 'score-high' : (job.match_score >= 40 ? 'score-med' : 'score-low');
            const card = document.createElement('div');
            card.className = 'job-card glass-panel';
            const hasLongDesc = job.description && job.description.length > 100;
            card.innerHTML = `
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div class="match-score ${matchClass}">${job.match_score.toFixed(1)}%</div>
                </div>
                <div class="job-company" style="font-weight: 500; color: var(--primary-color); font-size: 0.9rem; margin-bottom: 5px;">${getJobCompany(job.id)}</div>
                <div class="job-desc">${job.description}</div>
                ${hasLongDesc ? '<span class="view-more-link">View More</span>' : ''}
                <div class="job-skills">
                    ${job.skills.map(skill => `<span class="job-skill">${skill}</span>`).join('')}
                </div>
                <!-- Dynamic recommendation text based on matching score -->
                ${job.match_score >= 70 ? '<div style="color: #3fb950; font-size: 0.85rem; margin-bottom: 15px;">✨ Highly Recommended Match</div>' : ''}
                <button class="btn-apply">View & Apply</button>
            `;
            jobsGrid.appendChild(card);
        });
        resultsSection.classList.remove('hidden');
        currentUser.dashboard.totalResumes++;
        let maxScore = 0;
        data.matched_jobs.forEach(job => { if (job.match_score > maxScore) maxScore = job.match_score; });
        if (maxScore >= 70) currentUser.dashboard.shortlisted++;
        let actScore = Math.round(maxScore);
        if (currentUser.dashboard.totalResumes === 1) {
            currentUser.dashboard.avgScore = actScore;
        } else {
            currentUser.dashboard.avgScore = Math.round(((currentUser.dashboard.avgScore * (currentUser.dashboard.totalResumes - 1)) + actScore) / currentUser.dashboard.totalResumes);
        }
        currentUser.dashboard.recentActivity.unshift({
            message: `Parsed resume map: ${data.candidate_info.filename}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString()
        });
        if (currentUser.dashboard.recentActivity.length > 5) currentUser.dashboard.recentActivity.pop();
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let uIndex = users.findIndex(u => u.email === currentUser.email);
        if (uIndex > -1) { users[uIndex] = currentUser; localStorage.setItem('users', JSON.stringify(users)); }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        currentUser.dashboard.lastRecs = data.matched_jobs;
        if (typeof renderSidebarRecs !== 'undefined') renderSidebarRecs(3);
        renderDashboard();
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-more-link')) {
            const link = e.target;
            const desc = link.previousElementSibling;
            const isExpanded = desc.classList.toggle('expanded');
            link.textContent = isExpanded ? 'View Less' : 'View More';
            return;
        }
        const button = e.target.closest('.btn-apply');
        if (button) {
            const currentCandidate = JSON.parse(localStorage.getItem('currentUser'));
            const filename = document.getElementById('candidate-filename')?.textContent || 'Resume.pdf';
            const dateStr = new Date().toLocaleDateString();
            const jobCard = button.closest('.job-card');
            const jobTitle = jobCard?.querySelector('.job-title')?.textContent || "Position";
            const companyElem = jobCard?.querySelector('.job-company');
            const companyName = companyElem ? companyElem.textContent.trim() : "Standard Corp";
            const matchScore = jobCard?.querySelector('.match-score')?.textContent || "0%";
            const file = resumeInput.files[0];
            const reader = new FileReader();
            reader.onload = function (event) {
                const resumeContent = event.target.result;
                let applications = JSON.parse(localStorage.getItem('applications')) || [];
                const newApp = {
                    candidateName: `${currentCandidate.firstName} ${currentCandidate.lastName}`,
                    candidateEmail: currentCandidate.email,
                    jobTitle: jobTitle,
                    company: companyName.toLowerCase(),
                    displayCompany: companyName,
                    matchScore: matchScore,
                    resumeFile: filename,
                    resumeContent: resumeContent,
                    date: dateStr
                };
                applications.push(newApp);
                localStorage.setItem('applications', JSON.stringify(applications));
                button.textContent = 'Applied ✓';
                button.style.background = 'var(--match-high)';
                button.style.borderColor = 'var(--match-high)';
                button.style.color = 'white';
                button.disabled = true;
                setTimeout(() => {
                    alert(`Successfully applied for ${jobTitle} at ${companyName}!`);
                }, 100);
            };
            if (file) {
                reader.readAsDataURL(file);
            } else {
                alert("Please analyze your resume before applying.");
            }
        }
    });
});