import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, expert, discoveryData, phase } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Build context for Claude based on expert profile and discovery data
    const expertContext = `
EXPERT PROFILE:
- Name: ${expert.name} (${expert.preferred_name || expert.name})
- Role: ${expert.role} in ${expert.department}
- Experience: ${expert.years_experience} years
- Specializations: ${expert.areas_specialization || 'Not specified'}
- Previous Roles: ${expert.previous_roles || 'Not specified'}
`

    const discoveryContext = `
DISCOVERY DATA:
- Topic: ${discoveryData.topic}
- Category: ${discoveryData.category}
- Frequency: ${discoveryData.frequency}
- People Involved: ${discoveryData.people_involved}
- Duration: ${discoveryData.duration}
- Complexity: ${discoveryData.complexity}/5
- Business Impact: ${discoveryData.business_impact}/5
- Learning Curve: ${discoveryData.learning_curve}
- Goals: ${discoveryData.goals.join(', ')}
- Urgency: ${discoveryData.urgency}
`

    const systemPrompt = `You are Owly, an expert AI interviewer specialized in knowledge extraction for business documentation. You are conducting a deep knowledge extraction interview.

${discoveryContext}

${expertContext}

YOUR ROLE:
Continue the knowledge extraction interview about "${discoveryData.topic}". Your goal is to uncover tacit knowledge, decision-making frameworks, edge cases, and practical wisdom that would be valuable for business documentation.

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

AREAS TO EXPLORE BASED ON DISCOVERY:
- Decision points and criteria in their ${discoveryData.frequency} process
- Common mistakes and how to avoid them
- Variations in approach for different situations
- Warning signs and red flags
- Success indicators and quality measures
- Relationships with the ${discoveryData.people_involved} people involved
- Tools, systems, and resources used
- Time management given ${discoveryData.duration} duration
- Communication and coordination aspects

Remember: You're extracting knowledge for ${discoveryData.goals.join(' and ')}. Focus on actionable, practical insights that others can learn from.`

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