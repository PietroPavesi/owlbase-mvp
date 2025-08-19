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
      // Get client_id from the allowed_experts table
      const { data: allowedExpert } = await supabase
        .from('allowed_experts')
        .select('client_id')
        .eq('email', email)
        .single()
  
      if (!allowedExpert) {
        throw new Error('Client not found')
      }
  
      // Insert expert profile
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
  
      // Fetch the created expert and show dashboard
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

  // Email Input Screen
  if (showEmailInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            {/* Logo & Branding */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                <span className="text-3xl">🦉</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Owlbase.ai</h1>
              <p className="text-lg text-stone-600 font-medium">Transform your expertise into knowledge assets</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-stone-200">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Expert Access</h2>
                <p className="text-stone-600">Enter your authorized email to begin your knowledge journey</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-3">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 placeholder-stone-400"
                    placeholder="your.email@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {loading ? 'Checking your access...' : 'Continue Your Knowledge Journey'}
                </button>
              </form>

              {message && (
                <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                  {message}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-stone-500">
                Need access? <span className="text-amber-600 font-semibold cursor-pointer hover:text-amber-700 transition-colors">Contact Sales</span>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
              <span className="text-3xl">🦉</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Welcome to Owlbase</h1>
            <p className="text-stone-600 text-lg">{email}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-stone-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Let's get to know your expertise</h2>
              <p className="text-stone-600">Help Owly understand your background so we can have more meaningful conversations</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Full Name *</label>
                  <input 
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Preferred Name</label>
                  <input 
                    type="text"
                    name="preferred_name"
                    value={profileData.preferred_name}
                    onChange={handleProfileChange}
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="Johnny"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Current Role *</label>
                  <input 
                    type="text"
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    required
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="Senior Operations Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Department *</label>
                  <input 
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    required
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="Operations"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Years of Experience *</label>
                  <input 
                    type="number"
                    name="years_experience"
                    value={profileData.years_experience}
                    onChange={handleProfileChange}
                    required
                    min="0"
                    max="50"
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Phone Number</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Areas of Specialization</label>
                <textarea 
                  name="areas_specialization"
                  value={profileData.areas_specialization}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 resize-none"
                  placeholder="Describe your areas of expertise and specialization..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Previous Relevant Roles</label>
                <textarea 
                  name="previous_roles"
                  value={profileData.previous_roles}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 resize-none"
                  placeholder="Previous roles related to your current knowledge area..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={profileLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {profileLoading ? 'Creating your profile...' : 'Begin Knowledge Sharing'}
              </button>
            </form>

            {message && (
              <div className={`mt-6 p-4 rounded-2xl ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

  // Main Dashboard
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl">🦉</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Owlbase.ai</h1>
                <p className="text-sm text-stone-600 font-medium">Knowledge Extraction Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">{expert?.name}</p>
                <p className="text-sm text-stone-600">{expert?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm text-stone-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-stone-100 transition-all duration-200 font-medium"
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
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Welcome back, {expert?.name}! 👋
          </h2>
          <p className="text-xl text-stone-600 mb-8 leading-relaxed max-w-4xl">
            Your expertise is valuable. Let's capture it, understand it, and transform it into lasting knowledge assets for your organization.
          </p>
          
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-5 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-xl shadow-lg hover:shadow-xl hover:-translate-y-1">
            🦉 Start New Session with Owly
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Previous Sessions */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <span className="text-amber-600 text-xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Previous Sessions</h3>
            </div>
            <div className="text-center py-12">
              <p className="text-stone-500 mb-4 text-lg">No sessions yet</p>
              <p className="text-stone-400">Your conversation history with Owly will appear here</p>
            </div>
          </div>

          {/* Generated Documents */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <span className="text-green-600 text-xl">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Knowledge Assets</h3>
            </div>
            <div className="text-center py-12">
              <p className="text-stone-500 mb-4 text-lg">No documents yet</p>
              <p className="text-stone-400">Process docs, training materials, and decision trees will appear here</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-amber-50 to-green-50 p-8 rounded-3xl border border-amber-200 shadow-lg">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">How Owlbase Transforms Your Expertise</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white">💬</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Natural Conversation</h4>
                <p className="text-stone-600">Share your knowledge through guided dialogue with Owly, our AI companion</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white">🧠</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Intelligent Extraction</h4>
                <p className="text-stone-600">AI captures, structures, and refines your expertise into organized knowledge</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white">📄</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Professional Documentation</h4>
                <p className="text-stone-600">Receive polished guides, SOPs, and training materials ready for your team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}