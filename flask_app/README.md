# MeritAlloc — Python + Flask Edition

This folder contains the complete **Python + Flask** conversion of MeritAlloc, using:
- **Flask** (`app.py`) for routing, HTML template rendering (`templates/index.html`), and REST API endpoints (`/api/health`, `/api/allocate`, `/api/evaluate-student`, `/api/evaluate-role`, `/api/parse-resume`, `/api/starter-data`)
- **Google GenAI Python SDK (`google-genai`)** with `gemini-4-hydrogen` for internship capability percentage scoring and resume parsing
- **Firebase Auth & Cloud Firestore** (`firebase-applet-config.json`) for Student and Recruiter accounts, shared posted roles, and capability scores

## Run Locally

```bash
cd flask_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Add your GEMINI_API_KEY in .env

python app.py
```

The server listens on `http://localhost:3000` (configurable via `PORT`).

For production with Gunicorn:

```bash
gunicorn -w 2 -b 0.0.0.0:3000 app:app
```
