'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type DiscoveryData = {
  topic: string
  category: string
  frequency: string
  people_involved: string
  duration: string
  complexity: number
  business_impact: number
  learning_curve: string
  goals: string[]
  urgency: string
}

export default function SessionPage() {
  const [expert, setExpert] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionPhase, setSessionPhase] = useState<'discovery' | 'ai_interview'>('discovery')
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [messageCount, setMessageCount] = useState(0)
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData>({
    topic: '',
    category: '',
    frequency: '',
    people_involved: '',
    duration: '',
    complexity: 3,
    business_impact: 3,
    learning_curve: '',
    goals: [],
    urgency: ''
  })
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
    const storedEmail = localStorage.getItem('owlbase_expert_email')
    if (!storedEmail) {
      window.location.href = '/dashboard'
      return
    }

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
    }
  }

  const handleDiscoveryChange = (field: string, value: any) => {
    setDiscoveryData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGoalToggle = (goal: string) => {
    setDiscoveryData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const saveDiscoveryData = async () => {
    if (sessionId) {
      await supabase
        .from('sessions')
        .update({
          conversation_data: [{
            type: 'discovery',
            data: discoveryData,
            timestamp: new Date().toISOString()
          }],
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }
  }

  const startAIInterview = async () => {
    setLoading(true)

    try {
      // Save discovery data first
      await saveDiscoveryData()

      const response = await fetch('/api/start-ai-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discoveryData: discoveryData,
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
        
        setMessages([aiStartMessage])
        setSessionPhase('ai_interview')
        setSessionStartTime(new Date())
        setMessageCount(1)

        // Save initial AI message
        if (sessionId) {
          await supabase
            .from('sessions')
            .update({
              conversation_data: [{
                type: 'discovery',
                data: discoveryData,
                timestamp: new Date().toISOString()
              }, {
                type: 'message',
                role: 'assistant',
                content: aiStartMessage.content,
                timestamp: aiStartMessage.timestamp.toISOString()
              }],
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
        }
      }
    } catch (error) {
      console.error('Error starting AI interview:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSessionCompletion = (newMessageCount: number) => {
    if (!sessionStartTime) return false
    
    const timeElapsed = (new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60) // minutes
    
    return timeElapsed >= 20 || newMessageCount >= 20
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

    const newMessageCount = messageCount + 1
    setMessageCount(newMessageCount)

    try {
      const shouldComplete = checkSessionCompletion(newMessageCount)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          expert: expert,
          discoveryData: discoveryData,
          phase: 'ai_interview',
          shouldComplete: shouldComplete,
          messageCount: newMessageCount,
          timeElapsed: sessionStartTime ? (new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60) : 0
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from Owly')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setMessageCount(prev => prev + 1)

      // Save conversation to database
      if (sessionId) {
        const conversationData = [{
          type: 'discovery',
          data: discoveryData,
          timestamp: new Date().toISOString()
        }]

        // Add all messages
        updatedMessages.forEach(msg => {
          conversationData.push({
            type: 'message',
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          })
        })

        conversationData.push({
          type: 'message',
          role: assistantMessage.role,
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp.toISOString()
        })

        await supabase
          .from('sessions')
          .update({
            conversation_data: conversationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
      }

      // Check if session should end
      if (data.shouldEnd || shouldComplete) {
        setTimeout(() => {
          endSession(true)
        }, 3000)
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

  const endSession = async (isComplete = false) => {
    if (sessionId && isComplete) {
      // Show loading state for document generation
      setLoading(true)
      
      try {
        const response = await fetch('/api/generate-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId: sessionId }),
        })

        if (response.ok) {
          // Documents generated successfully
          await supabase
            .from('sessions')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)
        }
      } catch (error) {
        console.error('Error generating documents:', error)
      }
    } else if (sessionId) {
      // Just cancel the session
      await supabase
        .from('sessions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }
    
    window.location.href = '/dashboard'
  }

  const isDiscoveryComplete = () => {
    return discoveryData.topic && 
           discoveryData.category && 
           discoveryData.frequency && 
           discoveryData.people_involved && 
           discoveryData.duration && 
           discoveryData.learning_curve && 
           discoveryData.goals.length > 0 && 
           discoveryData.urgency
  }

  // Render markdown-like content in messages
  const renderMessageContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Handle bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return (
            <div key={index} className="flex items-start gap-2 my-1">
              <span className="text-amber-600 mt-1">•</span>
              <span>{line.replace(/^[•-]\s*/, '')}</span>
            </div>
          )
        }
        
        // Handle numbered lists
        if (line.match(/^\d+\./)) {
          return (
            <div key={index} className="flex items-start gap-2 my-1">
              <span className="text-amber-600 font-medium">{line.match(/^\d+\./)?.[0]}</span>
              <span>{line.replace(/^\d+\.\s*/, '')}</span>
            </div>
          )
        }

        // Handle bold text **text**
        if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/g)
          return (
            <div key={index} className="my-1">
              {parts.map((part, partIndex) => 
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={partIndex} className="font-semibold text-gray-900">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={partIndex}>{part}</span>
                )
              )}
            </div>
          )
        }

        // Regular lines
        return line ? <div key={index} className="my-1">{line}</div> : <div key={index} className="my-2"></div>
      })
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🦉</span>
          </div>
          <div className="w-8 h-1 bg-amber-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Discovery Form Phase
  if (sessionPhase === 'discovery') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🦉</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Knowledge Discovery</h1>
                  <p className="text-sm text-gray-600">Setting up your expertise session • {expert.name}</p>
                </div>
              </div>
              <button 
                onClick={() => endSession(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Let's understand your expertise</h2>
                <p className="text-gray-600">Please fill out this quick form so Owly can have a more focused conversation with you.</p>
              </div>

              <div className="space-y-6">
                {/* Question 1: Topic & Scope */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    1. What specific process or expertise area do you want to focus on? *
                  </label>
                  <input
                    type="text"
                    value={discoveryData.topic}
                    onChange={(e) => handleDiscoveryChange('topic', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                    placeholder="e.g., Customer onboarding process, Sales negotiation techniques, Equipment troubleshooting..."
                  />
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={discoveryData.category}
                      onChange={(e) => handleDiscoveryChange('category', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                    >
                      <option value="">Select category...</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Technical">Technical</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Management">Management</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">Human Resources</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Question 2: Process Frequency & Scale */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    2. How often does this process happen, and how many people are typically involved? *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                      <select
                        value={discoveryData.frequency}
                        onChange={(e) => handleDiscoveryChange('frequency', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="As-needed">As-needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">People Involved</label>
                      <select
                        value={discoveryData.people_involved}
                        onChange={(e) => handleDiscoveryChange('people_involved', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="1-3">1-3 people</option>
                        <option value="4-10">4-10 people</option>
                        <option value="11-25">11-25 people</option>
                        <option value="25+">25+ people</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration per Instance</label>
                      <select
                        value={discoveryData.duration}
                        onChange={(e) => handleDiscoveryChange('duration', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="Minutes">Minutes</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Question 3: Complexity & Impact */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    3. How would you rate this process? *
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complexity: {discoveryData.complexity}/5
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Simple</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={discoveryData.complexity}
                          onChange={(e) => handleDiscoveryChange('complexity', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-500">Highly specialized</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Impact: {discoveryData.business_impact}/5
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Low impact</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={discoveryData.business_impact}
                          onChange={(e) => handleDiscoveryChange('business_impact', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-500">Mission critical</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Learning Curve</label>
                      <select
                        value={discoveryData.learning_curve}
                        onChange={(e) => handleDiscoveryChange('learning_curve', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="">How long to master...</option>
                        <option value="Days">Days</option>
                        <option value="Weeks">Weeks</option>
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Question 4: Knowledge Sharing Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    4. What's your primary goal for documenting this knowledge? *
                  </label>
                  <div className="space-y-3">
                    {['Team training', 'Process standardization', 'AI system training', 'Knowledge preservation', 'Onboarding materials'].map((goal) => (
                      <label key={goal} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discoveryData.goals.includes(goal)}
                          onChange={() => handleGoalToggle(goal)}
                          className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-gray-700">{goal}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                    <select
                      value={discoveryData.urgency}
                      onChange={(e) => handleDiscoveryChange('urgency', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900 bg-white"
                    >
                      <option value="">Select priority...</option>
                      <option value="Low">Low priority</option>
                      <option value="Medium">Medium priority</option>
                      <option value="High">High priority</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={startAIInterview}
              disabled={!isDiscoveryComplete() || loading}
              className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting AI Interview...' : 'Start AI Interview with Owly'}
            </button>
            {!isDiscoveryComplete() && (
              <p className="text-sm text-gray-500 mt-2 text-center">Please complete all required fields</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // AI Interview Phase (Chat Interface)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🦉</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Knowledge Interview</h1>
                <p className="text-sm text-gray-600">Deep expertise extraction • {expert.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {messageCount}/20 messages
              </div>
              <button 
                onClick={() => endSession(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">🦉</span>
                  </div>
                )}
                
                <div className={`max-w-2xl ${message.role === 'user' ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200'} rounded-lg p-4 shadow-sm`}>
                  <div className={`${message.role === 'user' ? 'text-amber-700' : 'text-amber-600'} text-xs font-medium mb-2`}>
                    {message.role === 'assistant' ? 'Owly' : expert.name}
                  </div>
                  <div className={`${message.role === 'user' ? 'text-amber-900' : 'text-gray-900'}`}>
                    {message.role === 'assistant' ? renderMessageContent(message.content) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  <div className={`${message.role === 'user' ? 'text-amber-600' : 'text-gray-400'} text-xs mt-2`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {expert.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">🦉</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="text-amber-600 text-xs font-medium mb-2">Owly</div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm">AI is thinking deeply...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Continue the conversation with Owly..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none text-gray-900 bg-white"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-amber-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}