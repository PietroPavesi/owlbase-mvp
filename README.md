# Owlbase.ai MVP

> Transform expert knowledge into professional documentation through AI-powered conversations

Owlbase.ai helps SME leaders capture critical knowledge before employees retire or leave. Through natural 30-minute conversations with Owly (our AI assistant), experts automatically generate process documents, training materials, decision trees, and AI-ready datasets.

## 🎯 Problem We're Solving

- **42%** of domain knowledge exists only in employees' minds
- **10,000** Baby Boomers retire daily, taking decades of expertise with them
- **75%** of companies struggle to implement AI due to lack of structured knowledge

## 🦉 How Owlbase Works

1. **30-Minute AI Interview** - Owly asks smart questions to understand your expert's processes and know-how
2. **Auto-Generate Documents** - AI instantly creates training guides, SOPs, and decision trees from the conversation
3. **Download & Use** - Get ready-to-use materials you can implement immediately

## 🚀 Features

### Current MVP
- **Client Management** - Admin panel for setting up new clients and authorizing experts
- **Expert Authentication** - Email whitelist system for secure access control
- **Profile Setup** - Comprehensive expert background capture
- **Branded Dashboard** - Professional interface following Owlbase design system

### Coming Next
- **Owly Chat Interface** - Natural conversation flow with AI interviewer
- **Document Generation** - Auto-create process docs, training materials, decision trees
- **Knowledge Assets Library** - View, download, and manage generated documents
- **Session Management** - Save, resume, and review interview sessions

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude API for conversations
- **Deployment**: Vercel (planned)

## 📋 Database Schema

```sql
clients - SME customer companies
├── allowed_experts - Email whitelist per client
├── experts - Registered expert profiles
    ├── sessions - Interview conversations with Owly
    └── documents - Generated knowledge assets
🏗 Development Setup
bash# Clone repository
git clone https://github.com/yourusername/owlbase-mvp.git
cd owlbase-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Anthropic API keys

# Run development server
npm run dev
Environment Variables
bashNEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
🎨 Brand Guidelines
Owlbase follows a warm, professional design system:

Primary Colors: Amber Glow (#FF8C00), Sage Wisdom (#059669)
Typography: Inter (headings), Source Serif Pro (wisdom moments)
Voice: Wise mentor and trusted colleague
Logo: Owl icon representing wisdom and guidance

📱 User Flows
Admin Flow

Visit /admin
Create new client company
Add authorized expert email addresses
Share platform access with experts

Expert Flow

Visit /dashboard
Enter authorized email address
Complete profile setup (first time)
Start knowledge extraction session with Owly
View and download generated documents

🔐 Security

Row Level Security (RLS) policies for data isolation
Email-based access control (no passwords for MVP)
Client-specific expert authorization
Secure API key management

🚀 Deployment
bash# Build for production
npm run build

# Deploy to Vercel
vercel deploy
📊 Business Model

Target: SME (Small/Medium Enterprises)
Pricing: $2,000-3,500 per project
Model: Project-based consulting → SaaS transition planned
Timeline: 6 months to launch, then find co-founder

🤝 Contributing
This is an MVP in active development. Focus areas:

Owly chat interface development
Document generation pipeline
UX improvements for expert onboarding
Performance optimization

📄 License
Proprietary - All rights reserved

Built with ❤️ for the future of knowledge work
Owlbase.ai - Where expertise becomes organizational wisdom