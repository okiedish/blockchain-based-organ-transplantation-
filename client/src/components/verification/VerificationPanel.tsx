import { useState } from 'react';
import { Loader2, Fingerprint, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const toDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(f);
  });

/**
 * Prototype identity verification: upload -> prototype extraction -> user confirms -> admin review.
 * This does NOT authenticate with UIDAI or any government service.
 */
export const VerificationPanel = () => {
  const { user, refresh } = useAuth();
  const status = user?.verification?.status ?? 'UNVERIFIED';
  const [doc, setDoc] = useState<{ fileName: string; dataUrl: string } | null>(null);
  const [extracted, setExtracted] = useState<{ name: string; dateOfBirth: string; gender: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (status === 'VERIFIED') return null;

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const t = toast.loading('Processing document...');
    try {
      const dataUrl = await toDataUrl(file);
      const r = await api<any>('/verification/extract', { method: 'POST', body: { document: { fileName: file.name, dataUrl } } });
      setDoc({ fileName: file.name, dataUrl });
      setExtracted(r.extracted);
      setNotice(r.notice);
      toast.success('Document processed. Check the details below.', { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!doc || !extracted) return;
    setBusy(true);
    const t = toast.loading('Verifying identity...');
    try {
      await api('/verification/submit', { method: 'POST', body: { aadhaarNumber: aadhaar, document: doc, extracted, confirmed: true } });
      toast.success('Submitted. An administrator will review your details.', { id: t });
      await refresh();
    } catch (e: any) {
      toast.error(e.message, { id: t });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5" />
          Identity Verification
          <Badge variant="outline">Prototype</Badge>
        </CardTitle>
        <CardDescription>
          Academic prototype: this is a format check plus manual admin review. It is not UIDAI / Aadhaar authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'REQUIRES_REVIEW' && <p className="text-sm">Your details are awaiting administrator review. You will be able to use the platform once approved.</p>}
        {status === 'REJECTED' && <p className="text-sm text-destructive">Your last submission was rejected{user?.verification?.reviewNote ? `: ${user.verification.reviewNote}` : ''}. You can submit again.</p>}
        {(status === 'UNVERIFIED' || status === 'REJECTED') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="doc">1. Upload ID document (PNG, JPEG or PDF, max 2 MB)</Label>
              <Input id="doc" type="file" accept="image/png,image/jpeg,application/pdf" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
              <p className="text-xs text-muted-foreground">The file is hashed and discarded; it is not stored.</p>
            </div>
            {extracted && (
              <>
                <p className="text-xs text-muted-foreground">{notice}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Name</Label><Input value={extracted.name} onChange={(e) => setExtracted({ ...extracted, name: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Date of birth</Label><Input type="date" value={extracted.dateOfBirth} onChange={(e) => setExtracted({ ...extracted, dateOfBirth: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Aadhaar number</Label><Input inputMode="numeric" placeholder="12 digits" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} /></div>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  I confirm these details match my document.
                </label>
                <Button variant="hero" disabled={busy || !confirmed || aadhaar.length !== 12 || !extracted.name || !extracted.dateOfBirth} onClick={submit}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Submit for review
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
