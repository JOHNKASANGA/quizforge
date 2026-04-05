# Quizforge AI

AI-powered question bank and testing platform. Upload any document — Claude reads it and generates MCQ, True/False, and Short Answer questions automatically.

## Features

- **AI Question Generation** — Upload PDF, DOCX, or TXT files. Claude extracts the text and generates questions with correct answers and explanations
- **Multiple question types** — Multiple Choice, True/False, Short Answer
- **Test engine** — Countdown timer, tab-switch anti-cheat detection, question flagging, progress bar
- **Score analytics** — Per-question review, pass/fail verdict, time taken
- **Export** — PDF and CSV score reports
- **CSV/JSON bulk upload** — Import question banks from structured files

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v5 (credentials + JWT) |
| AI | Anthropic SDK (`claude-sonnet-4`) |
| PDF | jsPDF + jspdf-autotable |
| File parsing | pdf-parse, mammoth |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/quizforge-ai
cd quizforge-ai
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com/

### 3. Set up database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed with sample data
npm run db:seed
```

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

### Demo credentials (after seeding)
- **Student:** `demo@quizforge.ai` / `password123`
- **Admin:** `admin@quizforge.ai` / `admin123`

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # User dashboard
│   ├── upload/page.tsx             # Document upload + AI generation
│   ├── review/[bankId]/page.tsx    # Question bank review
│   ├── test/[testId]/page.tsx      # Test-taking interface
│   ├── results/[scoreId]/page.tsx  # Score results + export
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth handler
│       │   └── register/route.ts       # User registration
│       ├── questions/
│       │   ├── generate/route.ts        # AI question generation ← core
│       │   ├── banks/route.ts           # List / create banks
│       │   ├── [bankId]/route.ts        # Get / delete bank
│       │   └── item/[questionId]/route.ts # Edit / delete question
│       ├── admin/
│       │   └── upload/route.ts          # CSV/JSON bulk import
│       ├── tests/
│       │   ├── route.ts                 # Create / list tests
│       │   ├── submit/route.ts          # Submit + score test ← core
│       │   └── [testId]/route.ts        # Get test for taking
│       └── scores/
│           ├── route.ts                 # List scores
│           └── [scoreId]/
│               ├── export/route.ts      # PDF export
│               └── export-csv/route.ts  # CSV export
├── components/
│   └── test/
│       └── TestEngine.tsx              # Test-taking component
├── lib/
│   ├── prisma.ts                       # DB singleton
│   ├── auth.ts                         # NextAuth config
│   ├── extractText.ts                  # PDF/DOCX/TXT text extraction
│   ├── generateQuestions.ts            # Claude AI integration ← core
│   └── scoring.ts                      # Score calculation + PDF generation
└── types/
    └── index.ts                        # Shared TypeScript types

prisma/
├── schema.prisma                       # Database schema
└── seed.ts                             # Sample data
```

## API Reference

### Generate questions from document

```
POST /api/questions/generate
Content-Type: multipart/form-data

Fields:
  file          File (PDF/DOCX/TXT) — or use pasteText
  pasteText     string — plain text content
  questionCount number (3–20)
  types         "mixed" | "mcq" | "tf" | "sa"
  difficulty    "easy" | "medium" | "hard" | "mixed"
  focusArea     string (optional)
  bankTitle     string (required)

Response: { data: { bankId, bankTitle, questionCount } }
```

### Submit a test

```
POST /api/tests/submit
Content-Type: application/json

Body:
  testId         string (cuid)
  answers        Record<questionId, answer>
  timeTakenSecs  number
  tabSwitchCount number

Response: { data: { scoreId, percentage, passed, questionReview[] } }
```

### Export score as PDF

```
GET /api/scores/:scoreId/export
Response: application/pdf binary
```

## CSV Upload Format

```csv
text,type,options,correctAnswer,explanation,difficulty
"What is X?",MULTIPLE_CHOICE,"[""A"",""B"",""C"",""D""]",0,"Because X is A",1
"Y is true",TRUE_FALSE,"[""True"",""False""]",0,"Y is indeed true",1
"Name X",SHORT_ANSWER,,X text here,"X is the answer",2
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

## Production Deployment

1. Deploy to Vercel: `vercel deploy`
2. Set environment variables in Vercel dashboard
3. Use a managed PostgreSQL (Neon, Supabase, Railway)
4. Run migrations: `npx prisma migrate deploy`
