'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function LightswitchApp() {
  const [user, setUser] = useState(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchFiles()
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchFiles()
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setFiles(data)
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !user) return

    setUploading(true)
    const storagePath = `${user.id}/${Date.now()}_${file.name}`

    const { error: storageError } = await supabase.storage
      .from('lightswitch-files')
      .upload(storagePath, file)

    if (storageError) {
      alert('Upload failed: ' + storageError.message)
      setUploading(false)
      return
    }

    const { error: dbError } = await supabase.from('files').insert([
      {
        name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        user_id: user.id
      }
    ])

    if (!dbError) fetchFiles()
    setUploading(false)
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-6">Lightswitch</h1>
        <button 
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-500 font-semibold px-6 py-3 rounded-lg transition"
        >
          Sign in with Google
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Lightswitch</h1>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md"
        >
          Sign Out
        </button>
      </header>

      <section className="mb-8">
        <label className="cursor-pointer inline-flex items-center bg-indigo-600 hover:bg-indigo-500 font-semibold px-5 py-2.5 rounded-lg transition">
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-semibold text-slate-400 grid grid-cols-3">
          <span>Name</span>
          <span>Size</span>
          <span>Date</span>
        </div>
        <div>
          {files.map((file) => (
            <div key={file.id} className="p-4 border-b border-slate-800/50 grid grid-cols-3 hover:bg-slate-800/40 transition">
              <span className="font-medium text-slate-200 truncate">{file.name}</span>
              <span className="text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
              <span className="text-slate-400">{new Date(file.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {files.length === 0 && (
            <p className="p-8 text-center text-slate-500">No files uploaded yet.</p>
          )}
        </div>
      </section>
    </main>
  )
}
