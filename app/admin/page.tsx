'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [clientName, setClientName] = useState('')
  const [expertEmails, setExpertEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({ name: clientName })
        .select()
        .single()

      if (clientError) throw clientError

      // Add expert emails
      const emails = expertEmails.split('\n').filter(email => email.trim())
      const expertData = emails.map(email => ({
        client_id: client.id,
        email: email.trim()
      }))

      const { error: emailError } = await supabase
        .from('allowed_experts')
        .insert(expertData)

      if (emailError) throw emailError

      setMessage(`✅ Success! Client "${clientName}" created with ${emails.length} expert emails authorized.`)
      setClientName('')
      setExpertEmails('')
      
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🦉</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Owlbase.ai</h1>
              <p className="text-sm text-stone-600 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Client Registration</h2>
          <p className="text-stone-600">Set up a new client and authorize their expert team members</p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-stone-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-slate-700 mb-3">
                Client Company Name
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 placeholder-stone-400"
                placeholder="Acme Corporation"
              />
              <p className="text-sm text-stone-500 mt-2">The company name for this knowledge extraction project</p>
            </div>

            <div>
              <label htmlFor="expertEmails" className="block text-sm font-semibold text-slate-700 mb-3">
                Authorized Expert Email Addresses
              </label>
              <textarea
                id="expertEmails"
                value={expertEmails}
                onChange={(e) => setExpertEmails(e.target.value)}
                required
                rows={8}
                className="w-full p-4 border-2 border-stone-300 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-900 placeholder-stone-400 resize-none"
                placeholder="john.doe@company.com&#10;jane.smith@company.com&#10;expert@company.com&#10;senior.manager@company.com"
              />
              <p className="text-sm text-stone-500 mt-2">
                Enter one email address per line. Only these emails will be able to access the platform.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {loading ? 'Setting up client...' : 'Create Client & Authorize Experts'}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-2xl ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-green-50 p-6 rounded-2xl border border-amber-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Next Steps</h3>
          <div className="space-y-3 text-sm text-stone-600">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p>Share the platform URL with your authorized experts: <code className="bg-white px-2 py-1 rounded text-amber-700">/dashboard</code></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p>Experts will complete their profiles and begin knowledge extraction sessions with Owly</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p>Monitor progress and download generated documents through the Supabase dashboard</p>
            </div>
          </div>
        </div>

        {/* Access Dashboard Link */}
        <div className="mt-6 text-center">
          <a 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            <span>🦉</span>
            Go to Expert Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}