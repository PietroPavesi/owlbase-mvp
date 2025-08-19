import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, expert, phase } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Build context for Claude based on expert profile and conversation
    const expertContext = `
EXPERT PROFILE:
- Name: ${expert.name} (${expert.preferred_name || expert.name})
- Role: ${expert.role} in ${expert.department}
- Experience: ${expert.years_experience} years
- Specializations: ${expert.areas_specialization || 'Not specified'}
- Previous Roles: ${expert.previous_roles || 'Not specified'}
`

    // Get the conversation history (user messages only for context)
    const conversationHistory = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .join('\n\n')

    const systemPrompt = `You are Owly, an expert AI interviewer specialized in knowledge extraction for business documentation. You are in the AI interview phase after completing discovery.

CONTEXT FROM DISCOVERY PHASE:
${conversationHistory}

${expertContext}

YOUR ROLE:
You are conducting a deep knowledge extraction interview. Your goal is to uncover tacit knowledge, decision-making frameworks, edge cases, and practical wisdom that would be valuable for business documentation.

INTERVIEW APPROACH:
1. Ask follow-up questions that dig into the "why" and "how" behind their answers
2. Explore edge cases and exceptions they've encountered
3. Uncover implicit knowledge and "unwritten rules"
4. Focus on practical wisdom gained through experience
5. Ask about specific examples and scenarios
6. Probe decision-making criteria and judgment calls

CONVERSATION STYLE:
- Be conversational and engaging, like a skilled business consultant
- Ask one focused question at a time
- Build on their previous answers
- Show genuine interest in their expertise
- Use their name occasionally to maintain personal connection
- Keep questions clear and specific

AREAS TO EXPLORE:
- Decision points and criteria
- Common mistakes and how to avoid them
- Variations in approach for different situations
- Warning signs and red flags
- Success indicators and quality measures
- Relationships with other processes or stakeholders
- Tools, systems, and resources
- Time management and prioritization
- Communication and coordination aspects

Remember: You're extracting knowledge that will become training materials, process documentation, and decision trees. Focus on actionable, practical insights that others can learn from.`

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nHere's the conversation so far:\n\n${messages.map((m: any) => `${m.role === 'user' ? expert.name : 'Owly'}: ${m.content}`).join('\n\n')}\n\nPlease continue the interview with an insightful follow-up question.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content[0].text

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}