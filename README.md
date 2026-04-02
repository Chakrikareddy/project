# AI Powered Resume Screening and Job Recommendation System

An intelligent Recruitment Platform that leverages Machine Learning to bridge the gap between job seekers and recruiters. This system provides automated resume screening (ATS), skill extraction, and data-driven job matching.

## 🚀 Key Features

### 👨‍💼 For Candidates
- **Smart Resume Upload**: Upload PDF resumes for instant analysis.
- **ATS Compatibility Check**: Receive an ATS score based on word count, skill density, and standard resume sections (Education, Experience).
- **AI Job Matching**: Automatically match with relevant job openings using TF-IDF and Cosine Similarity.
- **Skill Extraction**: Automated identification of technical skills from your resume.
- **Personal Dashboard**: Track application activity and recommendations.

### 🏢 For Recruiters
- **Centralized Dashboard**: Manage job postings and view candidate applications.
- **Efficient Screening**: Quickly identify the best-fit candidates for open roles.
- **Modern UI**: Streamlined interface for managing the end-to-end recruitment process.

## 🛠️ Technology Stack

- **Frontend**: 
  - HTML5 & CSS3 (Modern, Responsive Design)
  - Vanilla JavaScript (Dynamic UI logic)
- **Backend**:
  - FastAPI (High-performance Python Web Framework)
  - Scikit-Learn (TF-IDF Vectorization & Cosine Similarity)
  - PDFPlumber (Robust PDF Text Extraction)
  - Pandas (Data Management)
- **Database**: 
  - CSV for Job Listings
  - Local Storage (Mock Authentication & Session Management)

## 📁 Project Structure

```text
.
├── backend/
│   ├── main.py          # FastAPI application & ML logic
│   ├── data/
│   │   └── jobss.csv    # Job listings database
│   └── ...
├── frontend/
│   ├── index.html       # Landing page
│   ├── signup.html      # Candidate registration
│   ├── signin.html      # Candidate login
│   ├── recruiter-dashboard.html # Recruiter portal
│   ├── script.js        # Frontend logic & API integration
│   └── style.css        # Premium UI styling
├── requirements.txt     # Python dependencies
└── start.ps1            # Quick-start script
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js (Optional, for serving frontend if not using live-server)

### 1. Clone the repository
```bash
git clone https://github.com/Chakrikareddy/Resume-project.git
cd Resume-project
```

### 2. Setup Backend
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Application
You can use the provided PowerShell script (on Windows) or start the components manually:

**Backend:**
```bash
uvicorn backend.main:app --reload
```

**Frontend:**
Simply open `frontend/index.html` in your browser or use a Live Server extension in VS Code.

## 🧠 How it Works (The AI Logic)
1. **Extraction**: The system uses `pdfplumber` to extract raw text from uploaded PDF resumes.
2. **Analysis**: It identifies key skills using predefined regex patterns and calculates an **ATS Score** based on industry-standard resume structures.
3. **Matching**: 
   - The system converts the resume text and job descriptions into numerical vectors using **TF-IDF (Term Frequency-Inverse Document Frequency)**.
   - It calculates the **Cosine Similarity** between the resume vector and every job vector in the database.
   - Jobs with the highest similarity scores are recommended to the user.

## 📊 Future Enhancements
- [ ] Integration with External Job APIs (LinkedIn, Indeed).
- [ ] Deep Learning based NER (Named Entity Recognition) for better skill extraction.
- [ ] Real-time Chat between Recruiters and Candidates.
- [ ] Advanced Analytics Dashboard for Recruiters.

---
Developed as part of the **B.Tech Final Year Project**.
