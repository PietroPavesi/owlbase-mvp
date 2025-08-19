import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { discoveryContext, expert } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Extract discovery information from the conversation
    const discoveryAnswers = discoveryContext
      .filter((m: any) => m.role === 'user')
      .map((m: any, index: number) => {
        const questionLabels = [
          'TOPIC/PROCESS',
          'SCOPE & CONTEXT', 
          'PRACTICAL DETAILS',
          'EXPERTISE & DECISIONS'
        ]
        return `${questionLabels[index] || 'ADDITIONAL'}: ${m.content}`
      })
      .join('\n\n')

    const expertProfile = `
EXPERT PROFILE:
- Name: ${expert.name} (${expert.preferred_name || expert.name})
- Role: ${expert.role} in ${expert.department}
- Experience: ${expert.years_experience} years
- Specializations: ${expert.areas_specialization || 'Not specified'}
- Previous Roles: ${expert.previous_roles || 'Not specified'}
`

    const systemPrompt = `You are Owly, an expert AI interviewer who specializes in knowledge extraction for business documentation. You've just completed a discovery phase and are now starting the deep AI interview.

DISCOVERY PHASE RESULTS:
${discoveryAnswers}

${expertProfile}

YOUR MISSION:
Start an in-depth knowledge extraction interview that will uncover the tacit knowledge, practical wisdom, and expertise that ${expert.name} has developed. This conversation will be used to generate professional business documentation including process guides, training materials, and decision trees.

STARTING APPROACH:
1. Acknowledge the discovery information they've shared
2. Ask your first deep, insightful question based on their responses
3. Focus on an area that seems most critical or complex from their discovery answers
4. Ask for a specific example or scenario to ground the conversation

INTERVIEW STYLE:
- Be warm and professional, like a skilled business consultant
- Show genuine interest in their expertise
- Ask specific, focused questions (one at a time)
- Build on their knowledge systematically
- Use their name to maintain personal connection

AREAS TO PRIORITIZE:
- Critical decision points in their process
- Common problems and how they solve them
- What makes someone successful vs. unsuccessful
- Edge cases and exceptions
- Unwritten rules and insider knowledge
- Specific examples and war stories

Generate your opening question for the AI interview phase. Make it engaging, specific, and designed to uncover valuable practical knowledge.`

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