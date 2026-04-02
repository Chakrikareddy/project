from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import pandas as pd
import os
app = FastAPI(title="AI Resume Matching System ATS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
CSV_FILE_PATH = os.path.join(os.path.dirname(__file__), "data", "jobss.csv")
def load_jobs_from_csv():
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        print("✅ CSV Loaded. Columns:", df.columns)
        jobs = []
        for idx, row in df.iterrows():
            skills_raw = row.get("Key Skills", "")
            if pd.isna(skills_raw):
                skills_raw = ""
            skills = [s.strip() for s in str(skills_raw).split(",") if s.strip()]
            jobs.append({
                "id": idx,
                "title": str(row.get("Job Title", "Unknown Job")),
                "description": f"{row.get('Role Category', '')} | {row.get('Industry', '')} | {row.get('Functional Area', '')}",
                "skills": skills
            })
        return jobs
    except Exception as e:
        print("❌ CSV ERROR:", e)
        return []
AVAILABLE_JOBS = load_jobs_from_csv()
def extract_text_from_pdf(file_obj) -> str:
    try:
        text = ""
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + " "
        return text
    except Exception as e:
        print("❌ PDF ERROR:", e)
        return ""
def extract_skills_from_text(text: str) -> List[str]:
    common_skills = [
        "Python", "Java", "C++", "HTML", "CSS", "JavaScript", "React",
        "Node.js", "Machine Learning", "NLP", "FastAPI", "SQL",
        "Pandas", "Scikit", "Scikit-Learn", "Deep Learning",
        "REST", "API", "Frontend", "Backend", "Data Analysis"
    ]
    found_skills = set()
    text_lower = text.lower()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.add(skill)
    return list(found_skills)
def match_jobs(resume_text: str):
    if not resume_text.strip():
        return []
    documents = [resume_text]
    for job in AVAILABLE_JOBS:
        documents.append(
            job["title"] + " " +
            str(job["description"]) + " " +
            " ".join(job["skills"])
        )
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
    except ValueError:
        return []
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
    scored_jobs = []
    for idx, score in enumerate(cosine_sim[0]):
        percent_score = round(score * 100, 2)
        if percent_score > 10:
            job_data = AVAILABLE_JOBS[idx].copy()
            job_data["match_score"] = percent_score
            scored_jobs.append(job_data)
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_jobs
@app.get("/")
def read_root():
    return {"message": "Welcome to the AI ATS API"}
@app.get("/api/jobs")
def get_jobs():
    return {"jobs": AVAILABLE_JOBS}
@app.post("/api/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    text = extract_text_from_pdf(file.file)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
    skills = extract_skills_from_text(text)
    matched_jobs = match_jobs(text + " " + " ".join(skills))
    word_count = len(text.split())
    skills_count = len(skills)
    ats_score = 0
    if word_count > 100: ats_score += 40
    elif word_count > 50: ats_score += 20
    if skills_count >= 5: ats_score += 40
    elif skills_count >= 3: ats_score += 25
    if "Education" in text or "University" in text: ats_score += 10
    if "Experience" in text or "Work" in text: ats_score += 10
    return {
        "candidate_info": {
            "filename": file.filename,
            "extracted_skills": skills,
            "parsed_word_count": word_count,
            "ats_score": ats_score
        },
        "matched_jobs": matched_jobs
    }