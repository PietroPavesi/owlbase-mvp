'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const [expert, setExpert] = useState<any>(null)
  const [showEmailInput, setShowEmailInput] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    role: '',
    department: '',
    years_experience: '',
    preferred_name: '',
    phone: '',
    areas_specialization: '',
    previous_roles: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedEmail = localStorage.getItem('owlbase_expert_email')
    if (storedEmail) {
      setEmail(storedEmail)
      checkExpertExists(storedEmail)
    }
  }, [])

  const checkExpertExists = async (emailToCheck: string) => {
    const { data: expertData } = await supabase
      .from('experts')
      .select('*')
      .eq('email', emailToCheck)
      .single()

    if (expertData) {
      setExpert(expertData)
      setShowEmailInput(false)
    } else {
      setShowProfileForm(true)
      setShowEmailInput(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: allowedExpert, error } = await supabase
        .from('allowed_experts')
        .select('client_id')
        .eq('email', email)
        .single()

      if (error || !allowedExpert) {
        setMessage('Email not authorized. Please contact sales.')
        setLoading(false)
        return
      }

      localStorage.setItem('owlbase_expert_email', email)
      await checkExpertExists(email)

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('owlbase_expert_email')
    setEmail('')
    setExpert(null)
    setShowEmailInput(true)
    setShowProfileForm(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setMessage('')
  
    try {
      const { data: allowedExpert } = await supabase
        .from('allowed_experts')
        .select('client_id')
        .eq('email', email)
        .single()
  
      if (!allowedExpert) {
        throw new Error('Client not found')
      }
  
      const { error } = await supabase
        .from('experts')
        .insert({
          client_id: allowedExpert.client_id,
          email: email,
          name: profileData.name,
          preferred_name: profileData.preferred_name || null,
          phone: profileData.phone || null,
          role: profileData.role,
          department: profileData.department,
          years_experience: parseInt(profileData.years_experience),
          areas_specialization: profileData.areas_specialization || null,
          previous_roles: profileData.previous_roles || null
        })
  
      if (error) throw error
      await checkExpertExists(email)
      setMessage('Profile created successfully!')
  
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setProfileLoading(false)
    }
  }
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Loading state during hydration
  if (!mounted) {
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

  // Email Input Screen
  if (showEmailInput) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🦉</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Owlbase.ai</h1>
              <p className="text-gray-600">Knowledge Extraction Platform</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Expert Access</h2>
                <p className="text-gray-600 text-sm">Enter your authorized email to access the platform</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-gray-900"
                    placeholder="your.email@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Verifying access...' : 'Continue'}
                </button>
              </form>

              {message && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {message}
                </div>
              )}
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">
                Need access? <span className="text-amber-600 font-medium cursor-pointer hover:text-amber-700">Contact Sales</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Profile Setup Screen
  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🦉</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
              <p className="text-gray-600">{email}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Professional Information</h2>
                <p className="text-gray-600 text-sm">Help Owly understand your expertise and background</p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input 
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Name</label>
                    <input 
                      type="text"
                      name="preferred_name"
                      value={profileData.preferred_name}
                      onChange={handleProfileChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="Johnny"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                    <input 
                      type="text"
                      name="role"
                      value={profileData.role}
                      onChange={handleProfileChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="Senior Operations Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <input 
                      type="text"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="Operations"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                    <input 
                      type="number"
                      name="years_experience"
                      value={profileData.years_experience}
                      onChange={handleProfileChange}
                      required
                      min="0"
                      max="50"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Specialization</label>
                  <textarea 
                    name="areas_specialization"
                    value={profileData.areas_specialization}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                    placeholder="Describe your areas of expertise..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous Relevant Roles</label>
                  <textarea 
                    name="previous_roles"
                    value={profileData.previous_roles}
                    onChange={handleProfileChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                    placeholder="Previous roles related to your expertise..."
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {profileLoading ? 'Creating profile...' : 'Complete Setup'}
                </button>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Dashboard - Professional Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🦉</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Owlbase.ai</h1>
                <p className="text-xs text-gray-500">Knowledge Extraction Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{expert?.name}</p>
                <p className="text-xs text-gray-500">{expert?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome back, {expert?.name}
          </h2>
          <p className="text-gray-600 mb-6 max-w-3xl">
            Ready to capture and document your expertise? Start a new knowledge extraction session with Owly.
          </p>
          
          <button 
            onClick={() => window.location.href = '/session'}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
          >
            <span>🦉</span>
            Start New Session
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Previous Sessions */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-sm">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No sessions yet</p>
              <p className="text-gray-400 text-sm">Your conversation history with Owly will appear here</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xs">📄</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Documents Created</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Process docs, guides, decision trees</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xs">⏱️</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Session Time</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">0h</p>
              <p className="text-xs text-gray-500">Total knowledge capture time</p>
            </div>
          </div>
        </div>

        {/* Knowledge Assets */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-sm">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Knowledge Assets</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No documents generated yet</p>
            <p className="text-gray-400 text-sm">Your process docs, training materials, and decision trees will appear here</p>
          </div>
        </div>

        {/* Process Overview */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-green-50 p-6 rounded-xl border border-amber-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Discovery</h4>
                <p className="text-gray-600 text-sm">Answer structured questions about your expertise</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">AI Interview</h4>
                <p className="text-gray-600 text-sm">Engage in intelligent conversation with Owly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Documentation</h4>
                <p className="text-gray-600 text-sm">Receive professional business documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}