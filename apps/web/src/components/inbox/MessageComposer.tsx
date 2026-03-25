'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageComposer({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: MessageComposerProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (text && !disabled) {
      onSend(text);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (text && !disabled) {
        onSend(text);
        setInput('');
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex gap-3', className)}
    >
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
        className="min-h-[44px] max-h-32 resize-none border-neutral-200 bg-white px-4 py-3 text-sm focus-visible:ring-1"
      />
      <Button
        type="submit"
        size="default"
        disabled={!input.trim() || disabled}
        className="h-11 shrink-0 px-5"
      >
        {disabled ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}
