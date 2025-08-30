import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Fetch session data
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Fetch expert data
    const { data: expert } = await supabase
      .from('experts')
      .select('*')
      .eq('id', session.expert_id)
      .single()

    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      )
    }

    // Extract conversation data
    const conversationData = session.conversation_data || []
    const discoveryData = conversationData.find((item: any) => item.type === 'discovery')?.data
    const messages = conversationData.filter((item: any) => item.type === 'message')

    // Build conversation transcript
    const transcript = messages
      .map((msg: any) => `${msg.role === 'user' ? expert.name : 'Owly'}: ${msg.content}`)
      .join('\n\n')

    const documentPrompt = `You are a professional business documentation specialist. Based on the knowledge extraction session below, create comprehensive business documentation.

EXPERT PROFILE:
- Name: ${expert.name}
- Role: ${expert.role} in ${expert.department}
- Experience: ${expert.years_experience} years

DISCOVERY DATA:
${discoveryData ? `
- Topic: ${discoveryData.topic}
- Category: ${discoveryData.category}
- Frequency: ${discoveryData.frequency}
- Complexity: ${discoveryData.complexity}/5
- Business Impact: ${discoveryData.business_impact}/5
- Goals: ${discoveryData.goals?.join(', ')}
` : 'No discovery data available'}

CONVERSATION TRANSCRIPT:
${transcript}

Generate THREE professional business documents:

1. **PROCESS GUIDE** (Step-by-step operational guide)
2. **TRAINING MANUAL** (Comprehensive learning resource)
3. **DECISION TREE** (Decision-making framework)

For each document:
- Use professional business language
- Include specific examples from the conversation
- Make it actionable and practical
- Structure it for easy reference
- Include key insights and best practices

Format each document with clear headings, bullet points, and proper structure. Make them suitable for immediate business use.

CRITICAL: Return your response as a JSON object with this exact structure:
{
  "processGuide": "Full process guide content...",
  "trainingManual": "Full training manual content...",
  "decisionTree": "Full decision tree content..."
}

DO NOT include any text outside this JSON structure.`

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
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: documentPrompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate documents' },
        { status: 500 }
      )
    }

    const data = await response.json()
    let content = data.content[0].text

    // Clean up response to extract JSON
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let documents
    try {
      documents = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse generated documents' },
        { status: 500 }
      )
    }

    // Save documents to database
    const documentsToSave = [
      {
        session_id: sessionId,
        expert_id: session.expert_id,
        type: 'process_guide',
        title: `${discoveryData?.topic || 'Process'} - Process Guide`,
        content: documents.processGuide,
        created_at: new Date().toISOString()
      },
      {
        session_id: sessionId,
        expert_id: session.expert_id,
        type: 'training_manual',
        title: `${discoveryData?.topic || 'Process'} - Training Manual`,
        content: documents.trainingManual,
        created_at: new Date().toISOString()
      },
      {
        session_id: sessionId,
        expert_id: session.expert_id,
        type: 'decision_tree',
        title: `${discoveryData?.topic || 'Process'} - Decision Tree`,
        content: documents.decisionTree,
        created_at: new Date().toISOString()
      }
    ]

    // Insert documents
    const { error: insertError } = await supabase
      .from('documents')
      .insert(documentsToSave)

    if (insertError) {
      console.error('Failed to save documents:', insertError)
      return NextResponse.json(
        { error: 'Failed to save documents' },
        { status: 500 }
      )
    }

    // Update session status
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)

    return NextResponse.json({
      success: true,
      documents: {
        processGuide: documents.processGuide,
        trainingManual: documents.trainingManual,
        decisionTree: documents.decisionTree
      }
    })

  } catch (error) {
    console.error('Generate documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}