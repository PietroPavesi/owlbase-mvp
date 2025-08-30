import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { discoveryData, expert } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Format discovery data from the form
    const discoveryContext = `
TOPIC: ${discoveryData.topic}
CATEGORY: ${discoveryData.category}
FREQUENCY: ${discoveryData.frequency}
PEOPLE INVOLVED: ${discoveryData.people_involved}
DURATION: ${discoveryData.duration}
COMPLEXITY: ${discoveryData.complexity}/5
BUSINESS IMPACT: ${discoveryData.business_impact}/5
LEARNING CURVE: ${discoveryData.learning_curve}
GOALS: ${discoveryData.goals.join(', ')}
URGENCY: ${discoveryData.urgency}
`

    const expertProfile = `
EXPERT PROFILE:
- Name: ${expert.name} (${expert.preferred_name || expert.name})
- Role: ${expert.role} in ${expert.department}
- Experience: ${expert.years_experience} years
- Specializations: ${expert.areas_specialization || 'Not specified'}
- Previous Roles: ${expert.previous_roles || 'Not specified'}
`

    const systemPrompt = `You are Owly, an expert AI interviewer who specializes in knowledge extraction for business documentation. You've just completed a structured discovery phase and are now starting the deep AI interview.

DISCOVERY PHASE RESULTS:
${discoveryContext}

${expertProfile}

YOUR MISSION:
Start an in-depth knowledge extraction interview that will uncover the tacit knowledge, practical wisdom, and expertise that ${expert.name} has developed. This conversation will be used to generate professional business documentation including process guides, training materials, and decision trees.

CRITICAL INSTRUCTION: 
- Ask questions directly without explaining your reasoning or methodology
- Do NOT include meta-commentary about why you're asking questions
- Do NOT mention your interview strategy or approach
- Do NOT include notes or explanations about your process
- Just ask natural, conversational questions as a skilled consultant would

STARTING APPROACH:
1. Acknowledge the discovery information they've shared about "${discoveryData.topic}"
2. Ask your first deep, insightful question based on their discovery responses
3. Focus on the most critical or complex aspects given their complexity rating (${discoveryData.complexity}/5) and business impact (${discoveryData.business_impact}/5)
4. Ask for a specific example or scenario to ground the conversation

INTERVIEW STYLE:
- Be warm and professional, like a skilled business consultant
- Show genuine interest in their expertise
- Ask specific, focused questions (one at a time)
- Build on their knowledge systematically
- Use their name occasionally to maintain personal connection

AREAS TO PRIORITIZE BASED ON DISCOVERY:
- Critical decision points in their ${discoveryData.frequency} ${discoveryData.topic} process
- Common problems and how they solve them
- What makes someone successful vs. unsuccessful at this
- Edge cases and exceptions they've encountered
- Unwritten rules and insider knowledge
- Specific examples and war stories
- How they handle the ${discoveryData.people_involved} people typically involved
- Quality control and success metrics

RESPONSE FORMAT: Only include your actual greeting and question to the expert. Never include notes, explanations, or commentary about your interview approach.

Generate your opening question for the AI interview phase. Make it engaging, specific, and designed to uncover valuable practical knowledge about their ${discoveryData.topic} expertise.`
    

// Call Anthropic API for the opening question
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to start AI interview' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Start AI interview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}