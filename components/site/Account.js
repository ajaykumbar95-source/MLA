'use client'

import { useEffect, useState } from 'react'
import { api, fmtDate, IMAGES } from '@/lib/site/config'
import { PageBanner, StatusBadge, Loading, EmptyState } from './shared'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { User, LogIn, UserPlus, Inbox, MessageSquarePlus, Search } from 'lucide-react'

function AuthForms({ onAuthed, go }) {
  const [tab, setTab] = useState('login')
  const [login, setLogin] = useState({ email: '', password: '' })
  const [reg, setReg] = useState({ name: '', email: '', mobile: '', password: '' })
  const [busy, setBusy] = useState(false)

  const doLogin = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify(login) })
      if (r.user?.kind === 'admin' || (r.user?.role && r.user.role !== 'Citizen')) {
        localStorage.setItem('vsh_token', r.token); toast.success('Admin login detected'); go('admin'); return
      }
      onAuthed(r.token, r.user); toast.success(`Welcome, ${r.user.name}`)
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  const doReg = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify(reg) })
      onAuthed(r.token, r.user); toast.success(`Account created. Welcome, ${r.user.name}`)
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="h-14 w-14 rounded-full bg-brand-navy/5 flex items-center justify-center text-brand-navy"><User className="h-7 w-7" /></div>
          <h2 className="mt-3 font-display text-2xl font-bold text-brand-navy">Citizen Portal</h2>
          <p className="text-sm text-muted-foreground">Login to submit and track your requests</p>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full mb-4"><TabsTrigger value="login">Login</TabsTrigger><TabsTrigger value="register">Register</TabsTrigger></TabsList>
          <TabsContent value="login">
            <form onSubmit={doLogin} className="space-y-4">
              <div><Label className="mb-1.5 block">Email or Mobile</Label><Input value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} /></div>
              <div><Label className="mb-1.5 block">Password</Label><Input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} /></div>
              <Button type="submit" disabled={busy} className="w-full bg-brand-navy hover:bg-brand-navy-2"><LogIn className="h-4 w-4 mr-2" />{busy ? 'Please wait…' : 'Login'}</Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={doReg} className="space-y-4">
              <div><Label className="mb-1.5 block">Full Name</Label><Input value={reg.name} onChange={e => setReg({ ...reg, name: e.target.value })} /></div>
              <div><Label className="mb-1.5 block">Email</Label><Input type="email" value={reg.email} onChange={e => setReg({ ...reg, email: e.target.value })} /></div>
              <div><Label className="mb-1.5 block">Mobile</Label><Input maxLength={10} value={reg.mobile} onChange={e => setReg({ ...reg, mobile: e.target.value.replace(/\D/g, '') })} /></div>
              <div><Label className="mb-1.5 block">Password</Label><Input type="password" value={reg.password} onChange={e => setReg({ ...reg, password: e.target.value })} placeholder="At least 6 characters" /></div>
              <Button type="submit" disabled={busy} className="w-full bg-brand-saffron hover:bg-brand-saffron-hover text-white font-semibold"><UserPlus className="h-4 w-4 mr-2" />{busy ? 'Please wait…' : 'Create Account'}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

function CitizenDashboard({ user, go }) {
  const [reqs, setReqs] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { try { setReqs(await api('/users/me/requests')) } catch (e) {} finally { setLoading(false) } })() }, [])
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div><h2 className="font-display text-2xl font-bold text-brand-navy">Welcome, {user.name}</h2><p className="text-sm text-muted-foreground">{user.email}</p></div>
        <div className="flex gap-2">
          <Button onClick={() => go('grievance')} className="bg-brand-saffron hover:bg-brand-saffron-hover text-white font-semibold"><MessageSquarePlus className="h-4 w-4 mr-1.5" />New Request</Button>
          <Button onClick={() => go('track')} variant="outline"><Search className="h-4 w-4 mr-1.5" />Track</Button>
        </div>
      </div>
      <h3 className="font-semibold text-brand-navy mb-3">My Requests</h3>
      {loading ? <Loading /> : reqs.length === 0 ? <EmptyState icon={Inbox} title="No requests yet" desc="Submit your first request to see it here." /> : (
        <div className="space-y-3">
          {reqs.map(r => (
            <Card key={r.id} className="p-4 flex items-center justify-between gap-4">
              <div><div className="font-mono font-semibold text-brand-navy">{r.tracking_id}</div><div className="text-sm text-muted-foreground">{r.type} • {r.category} • {fmtDate(r.created_at)}</div></div>
              <StatusBadge status={r.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Account({ user, go, onAuthed }) {
  return (
    <div>
      <PageBanner title="Citizen Portal" subtitle="Create an account to submit requests and track their progress." image={IMAGES.community} breadcrumb="Home / Account" />
      <div className="container py-12">
        {user ? <CitizenDashboard user={user} go={go} /> : <AuthForms onAuthed={onAuthed} go={go} />}
      </div>
    </div>
  )
}
