'use client';

import { useState } from 'react';
import { Button, toast } from '@vj/ui';
import { api } from '@/lib/api';

export function CaptureModal({
  previewUrl,
  sessionId,
  onSaved,
}: {
  previewUrl: string | null;
  sessionId: string | null;
  onSaved: (captureId: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function downloadLocal() {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `try-on-${Date.now()}.jpg`;
    a.click();
    toast.success('Download started');
  }

  async function saveToGallery() {
    if (!previewUrl || !sessionId) {
      toast.error('Sign in and start a session to save captures');
      return;
    }
    setSaving(true);
    try {
      const blob = await fetch(previewUrl).then((r) => r.blob());
      const capture = await api.tryOn.registerCapture(sessionId, {
        storageKey: `captures/local/${sessionId}/${Date.now()}.jpg`,
        width: 1080,
        height: 1920,
        mimeType: blob.type || 'image/jpeg',
        fileSizeBytes: blob.size,
      });
      onSaved(capture.id);
      toast.success('Capture saved to gallery');
    } catch {
      toast.error('Could not save — try downloading locally');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={() => void downloadLocal()}>
        Download image
      </Button>
      <Button type="button" onClick={() => void saveToGallery()} disabled={saving || !sessionId}>
        {saving ? 'Saving…' : 'Save to gallery'}
      </Button>
    </div>
  );
}
