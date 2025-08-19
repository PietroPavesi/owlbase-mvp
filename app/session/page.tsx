'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [expert, setExpert] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [interviewPhase, setInterviewPhase] = useState<'discovery' | 'ai_interview'>('discovery')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeExpertAndSession()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeExpertAndSession = async () => {
    // Get expert from localStorage
    const storedEmail = localStorage.getItem('owlbase_expert_email')
    if (!storedEmail) {
      window.location.href = '/dashboard'
      return
    }

    // Fetch expert data
    const { data: expertData } = await supabase
      .from('experts')
      .select('*')
      .eq('email', storedEmail)
      .single()

    if (!expertData) {
      window.location.href = '/dashboard'
      return
    }

    setExpert(expertData)

    // Create new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        expert_id: expertData.id,
        title: `Knowledge Session - ${new Date().toLocaleDateString()}`,
        status: 'in_progress',
        conversation_data: []
      })
      .select()
      .single()

    if (session && !error) {
      setSessionId(session.id)
      
      // Start with Owly's structured greeting and first question
      const greeting: Message = {
        role: 'assistant',
        content: `Hello ${expertData.preferred_name || expertData.name}! 👋 I'm Owly, your AI companion for knowledge extraction.

I'm here to help capture your valuable expertise and transform it into useful documentation for your organization. Over the next 30 minutes, I'll ask you some targeted questions to understand a specific process or area of knowledge you'd like to document.

Let's start with the basics:

**What specific process, skill, or area of knowledge would you like to focus on today?**

This could be:
- A work process you handle regularly (like onboarding new clients, handling customer complaints, or managing projects)
- A specialized skill you've developed (like troubleshooting equipment, negotiating contracts, or training new employees)  
- A decision-making framework you use (like evaluating vendors, prioritizing tasks, or handling exceptions)

Please describe what you'd like to focus on, and why it would be valuable to document.`,
        timestamp: new Date()
      }
      
      setMessages([greeting])
    }
  }

  // Discovery phase structured questions
  const getNextStructuredQuestion = (conversationContext: Message[], expert: any) => {
    const messageCount = conversationContext.filter(m => m.role === 'user').length

    const discoveryQuestions = [
      {
        condition: (count: number) => count === 1,
        question: `Perfect! Now let me understand the scope and context.

**Tell me about this process:**
- Who are the key people involved?
- How often does this happen? (Daily, weekly, monthly, etc.)
- What triggers this process to start?
- What are the main goals or outcomes?`
      },
      
      {
        condition: (count: number) => count === 2,
        question: `Great context! Now for the practical details.

**About the actual work:**
- What are the main steps or phases?
- What tools, systems, or resources are involved?
- Where do challenges typically occur?
- What skills or knowledge are most critical?`
      },

      {
        condition: (count: number) => count === 3,
        question: `Excellent! One more set of questions to complete the picture.

**About the expertise and decisions:**
- What key decisions need to be made during this process?
- What common mistakes do people make when learning this?
- What "unwritten rules" or insider knowledge is important?
- How do you know when it's been done well?

After this, I'll hand you over to my AI interview system for a deeper conversation about your expertise!`
      },

      {
        condition: (count: number) => count >= 4,
        question: null // This triggers the transition to AI interview
      }
    ]

    const appropriateQuestion = discoveryQuestions.find(q => q.condition(messageCount))
    return appropriateQuestion?.question || null
  }

  // Transition to AI interview phase
  const startAIInterview = async (discoveryContext: Message[]) => {
    setInterviewPhase('ai_interview')
    
    const transitionMessage: Message = {
      role: 'assistant',
      content: `Perfect! I now have a good understanding of what we're working with. 

🔄 **Transitioning to AI Interview Mode**

I'm now going to hand you over to my advanced AI interview system. This AI has been trained specifically for knowledge extraction and will ask you much deeper, more nuanced questions based on everything you've just told me.

The AI will help uncover the tacit knowledge, edge cases, decision-making frameworks, and expertise that makes you successful at this process.

Ready? Let's dive deep! 🧠`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, transitionMessage])
    
    // Brief pause, then start AI interview
    setTimeout(async () => {
      try {
        const response = await fetch('/api/start-ai-interview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discoveryContext: discoveryContext,
            expert: expert
          }),
        })

        if (response.ok) {
          const data = await response.json()
          
          const aiStartMessage: Message = {
            role: 'assistant',
            content: data.content,
            timestamp: new Date()
          }
          
          setMessages(prev => [...prev, aiStartMessage])

          // Save updated conversation to database
          if (sessionId) {
            await supabase
              .from('sessions')
              .update({
                conversation_data: [...discoveryContext, transitionMessage, aiStartMessage],
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId)
          }
        }
      } catch (error) {
        console.error('Error starting AI interview:', error)
        const errorMessage: Message = {
          role: 'assistant',
          content: "I apologize, but I'm having trouble starting the AI interview. Please try refreshing the page.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }, 2000)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      let assistantMessage: Message

      if (interviewPhase === 'discovery') {
        // Discovery phase - use structured questions
        const structuredQuestion = getNextStructuredQuestion(updatedMessages, expert)
        
        if (structuredQuestion) {
          assistantMessage = {
            role: 'assistant',
            content: structuredQuestion,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, assistantMessage])

          // Save conversation to database
          if (sessionId) {
            await supabase
              .from('sessions')
              .update({
                conversation_data: [...updatedMessages, assistantMessage],
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId)
          }
        } else {
          // Discovery complete - transition to AI interview
          await startAIInterview(updatedMessages)
          setLoading(false)
          return
        }
      } else {
        // AI interview phase - send to Claude API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages,
            expert: expert,
            phase: 'ai_interview'
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response from Owly')
        }

        const data = await response.json()
        
        assistantMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Save conversation to database
        if (sessionId) {
          await supabase
            .from('sessions')
            .update({
              conversation_data: [...updatedMessages, assistantMessage],
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
        }
      }

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const endSession = async () => {
    if (sessionId) {
      await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)
    }
    window.location.href = '/dashboard'
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
            <span className="text-3xl">🦉</span>
          </div>
          <div className="w-12 h-1 bg-amber-500 rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg">🦉</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {interviewPhase === 'discovery' ? 'Discovery Session' : 'AI Knowledge Interview'} with Owly
                </h1>
                <p className="text-sm text-stone-600">
                  {interviewPhase === 'discovery' 
                    ? `Understanding your expertise • ${expert.name}` 
                    : `Deep knowledge extraction • ${expert.name}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                {interviewPhase === 'discovery' ? 'Phase 1: Discovery' : 'Phase 2: AI Interview'}
              </div>
              <button 
                onClick={endSession}
                className="text-sm text-stone-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-stone-100 transition-all duration-200 font-medium"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">🦉</span>
                </div>
              )}
              
              <div className={`max-w-3xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-stone-200'} rounded-2xl p-4 shadow-sm`}>
                <div className={`${message.role === 'user' ? 'text-blue-100' : 'text-amber-600'} text-xs font-medium mb-2`}>
                  {message.role === 'assistant' ? 'Owly' : expert.name}
                </div>
                <div className={`${message.role === 'user' ? 'text-white' : 'text-slate-900'} whitespace-pre-wrap leading-relaxed`}>
                  {message.content}
                </div>
                <div className={`${message.role === 'user' ? 'text-blue-200' : 'text-stone-400'} text-xs mt-2`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {expert.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🦉</span>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                <div className="text-amber-600 text-xs font-medium mb-2">Owly</div>
                <div className="flex items-center gap-2 text-stone-500">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm">
                    {interviewPhase === 'discovery' ? 'Owly is preparing...' : 'AI is thinking deeply...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  interviewPhase === 'discovery' 
                    ? "Share details about your process or expertise..." 
                    : "Continue the conversation with Owly's AI..."
                }
                className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 placeholder-stone-400 resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 flex-shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}