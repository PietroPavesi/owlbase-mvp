**Updated README.md:**

```markdown
# Owlbase.ai MVP

> Transform expert knowledge into professional documentation through AI-powered conversations

**STATUS: ✅ Core MVP Complete - Chat interface with Claude AI integration working**

Owlbase.ai helps SME leaders capture critical knowledge before employees retire or leave. Through natural 30-minute conversations with Owly (our AI assistant), experts automatically generate process documents, training materials, decision trees, and AI-ready datasets.

## 🎯 Problem We're Solving

- **42%** of domain knowledge exists only in employees' minds
- **10,000** Baby Boomers retire daily, taking decades of expertise with them
- **75%** of companies struggle to implement AI due to lack of structured knowledge

## 🦉 How Owlbase Works

1. **Discovery Phase** - Owly asks 4 structured questions to understand the expertise area
2. **AI Interview** - Claude AI conducts an intelligent, adaptive interview based on discovery context
3. **Document Generation** - AI transforms conversation into professional business documentation *(coming next)*

## 🚀 Current Features (MVP v0.2.0)

### ✅ Completed
- **Admin Panel** - Create clients and authorize expert email addresses
- **Expert Authentication** - Secure email-based access control
- **Profile Setup** - Comprehensive expert background capture  
- **Discovery Interview** - 4 structured questions to gather process context
- **AI-Powered Interview** - Claude AI integration for intelligent follow-up questions
- **Two-Phase Flow** - Smooth transition from discovery to AI interview
- **Session Management** - Real-time chat with conversation persistence
- **Branded Interface** - Professional UI following Owlbase design system

### 🔄 In Development
- **Document Generation** - Auto-create process docs, training materials, decision trees
- **Knowledge Assets Library** - View, download, and manage generated documents
- **Session History** - Review and access previous interviews
- **Document Templates** - Customizable output formats

### 📋 Planned Features
- **Multi-session Projects** - Break large knowledge areas into multiple sessions
- **Collaborative Review** - Team feedback on generated documents
- **Export Options** - PDF, Word, Confluence integration
- **Analytics Dashboard** - Track knowledge capture progress
- **AI Training Data Export** - Structured datasets for custom AI models

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Anthropic Claude 3.5 Sonnet for conversations
- **Deployment**: Vercel (ready)

## 📋 Database Schema

```sql
clients - SME customer companies
├── allowed_experts - Email whitelist per client
├── experts - Registered expert profiles
    ├── sessions - Interview conversations with Owly
    └── documents - Generated knowledge assets (coming next)
```

## 🏗 Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/owlbase-mvp.git
cd owlbase-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Anthropic API keys

# Run development server
npm run dev
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🎨 Brand Guidelines

Owlbase follows a warm, professional design system:
- **Primary Colors**: Amber Glow (#FF8C00), Sage Wisdom (#059669)
- **Typography**: Inter (headings), Source Serif Pro (wisdom moments)
- **Voice**: Wise mentor and trusted colleague
- **Logo**: Owl icon representing wisdom and guidance

## 📱 User Flows

### Admin Flow ✅
1. Visit `/admin`
2. Create new client company
3. Add authorized expert email addresses
4. Share platform access with experts

### Expert Flow ✅
1. Visit `/dashboard`
2. Enter authorized email address
3. Complete profile setup (first time)
4. Click "Start New Session with Owly"
5. **Discovery Phase**: Answer 4 structured questions about expertise area
6. **AI Interview**: Engage in intelligent conversation with Claude AI
7. View generated documents *(coming next)*

### Interview Experience ✅
The two-phase interview system ensures comprehensive knowledge capture:

**Phase 1: Discovery (4 Questions)**
- What process/expertise to focus on?
- Who's involved, frequency, triggers, goals?
- Main steps, tools, challenges, skills?
- Decisions, mistakes, unwritten rules, success measures?

**Phase 2: AI Interview**
- Claude AI takes over with intelligent follow-up questions
- Adapts based on discovery context and expert profile
- Explores edge cases, decision frameworks, practical wisdom
- Uncovers tacit knowledge and "war stories"

## 🔐 Security

- Row Level Security (RLS) policies for data isolation
- Email-based access control (no passwords for MVP)
- Client-specific expert authorization
- Secure API key management
- Conversation data encrypted at rest

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

Set environment variables in Vercel dashboard.

## 📊 Business Model

- **Target**: SME (Small/Medium Enterprises) 
- **Pricing**: $2,000-3,500 per project
- **Model**: Project-based consulting → SaaS transition planned
- **Timeline**: 6 months to launch, then find co-founder

## 🧪 Testing the MVP

1. **Setup**: Create client in `/admin`, add expert emails
2. **Expert Flow**: Login at `/dashboard`, complete profile
3. **Interview**: Start session, go through discovery + AI interview
4. **Conversation**: Test Claude's knowledge extraction capabilities

## 🎯 Next Milestones

### v0.3.0 - Document Generation (Next Sprint)
- [ ] Document generation API
- [ ] Process documentation templates
- [ ] Training material creation
- [ ] Decision tree generation
- [ ] Download/export functionality

### v0.4.0 - Knowledge Management
- [ ] Session history dashboard
- [ ] Document library interface
- [ ] Search and filter capabilities
- [ ] Document versioning

### v1.0.0 - Production Ready
- [ ] Performance optimization
- [ ] Advanced security features
- [ ] Multi-client dashboard
- [ ] Payment integration
- [ ] Customer onboarding automation

## 🤝 Contributing

This is an MVP in active development. Current focus areas:
1. Document generation pipeline
2. User experience optimization
3. Performance improvements
4. Error handling and edge cases

## 📈 Recent Updates

**v0.2.0 (Current)** - Chat Interface Complete
- Two-phase interview system working
- Claude AI integration functional
- Real-time conversation with persistence
- Expert profile context integration

**v0.1.0** - Foundation
- Database schema and authentication
- Branded admin and expert interfaces
- Profile management system

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for the future of knowledge work**

*Owlbase.ai - Where expertise becomes organizational wisdom*

🦉 **Ready for beta testing with real SME clients**