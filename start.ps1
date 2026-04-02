# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server in a separate job
Start-Job -ScriptBlock {
    cd "$PSScriptRoot\backend"
    & "$PSScriptRoot\venv\Scripts\uvicorn.exe" main:app --host 0.0.0.0 --port 8000
}

# Start frontend server
cd frontend
python -m http.server 8080

Write-Host "Servers started. Frontend: http://localhost:8080, Backend API: http://localhost:8000"
