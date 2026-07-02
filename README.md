# Cognify

Aplicație web pentru generarea de conținut de marketing folosind inteligență artificială (text, imagini, video) și publicarea directă pe Facebook.

## Tehnologii

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** Next.js 14, React, TypeScript
- **AI:** OpenAI API (GPT-4o-mini, DALL-E 3, Sora-2)
- **Social Media:** Facebook Graph API, OAuth 2.0

## Instalare

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env           # completați cu cheile API
```

### Frontend

```bash
cd frontend
npm install
```

## Lansare

Terminal 1 — backend:
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --port 8001
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev
```

Aplicația rulează la **http://localhost:3000**

## Structura proiectului

```
backend/
  main.py          — entry point FastAPI
  config.py        — setări, JWT, hashing parole
  database.py      — conexiune SQLite
  models.py        — modele bază de date (8 tabele)
  schemas.py       — validare date (Pydantic)
  auth.py          — autentificare, register, login
  ai.py            — generare conținut AI
  social.py        — publicare Facebook
  licenses.py      — administrare utilizatori

frontend/
  app/             — pagini (dashboard, admin, login)
  components/      — componente UI reutilizabile
  context/         — gestionare sesiune utilizator
  lib/             — configurare HTTP client
```

## Repository

```
https://github.com/Denisa-Costea/Costea_Denisa_Aplicatie_Practica_Informatica_Licenta
```

## Autor

Costea Denisa — Universitatea Politehnica Timișoara
