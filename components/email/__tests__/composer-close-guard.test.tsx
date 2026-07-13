import { render, screen, act, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { EmailComposer } from '../email-composer';

// ─── Heavy component mocks (mirrors recipient-paste.test.tsx) ──────────────────

vi.mock('@/components/email/rich-text-editor', () => ({
  RichTextEditor: ({ onChange }: { onChange?: (html: string) => void }) => (
    React.createElement('div', { 'data-testid': 'rich-text-editor', onClick: () => onChange?.('') })
  ),
}));

vi.mock('@/components/plugins/plugin-slot', () => ({ PluginSlot: () => null }));
vi.mock('@/components/identity/sub-address-helper', () => ({ SubAddressHelper: () => null }));
vi.mock('@/components/templates/template-picker', () => ({ TemplatePicker: () => null }));
vi.mock('@/components/templates/template-form', () => ({ TemplateForm: () => null }));
vi.mock('@/components/files/file-preview-modal', () => ({ FilePreviewModal: () => null }));
vi.mock('@/hooks/use-focus-trap', () => ({
  useFocusTrap: () => ({ current: null }),
}));
vi.mock('@/hooks/use-pro-multi-account-identities', () => ({
  useProMultiAccountIdentities: () => ({ enabled: false, groups: [], allIdentities: [] }),
  stripCrossAccountIdentityPrefix: (id: string) => ({ localAccountId: null, rawId: id }),
}));

// ─── Store mocks ──────────────────────────────────────────────────────────────

vi.mock('@/stores/auth-store', () => {
  const state = {
    client: null,
    identities: [],
    primaryIdentity: null,
    isAuthenticated: false,
    isDemoMode: false,
    activeAccountId: null,
    connectionLost: false,
    getClientForAccount: () => undefined,
    getAllConnectedClients: () => new Map(),
    syncIdentities: () => {},
    refreshIdentities: async () => {},
  };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useAuthStore: hook };
});

vi.mock('@/stores/identity-store', () => {
  const state = { identities: [], defaultIdentityId: null };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useIdentityStore: hook };
});

vi.mock('@/stores/account-store', () => {
  const state = { accounts: [], getAccountById: () => undefined };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useAccountStore: hook };
});

vi.mock('@/stores/email-store', () => {
  const state = {
    draftSaveEnabled: false,
    sendRawEmail: async () => ({ sent: true }),
  };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useEmailStore: hook };
});

vi.mock('@/stores/settings-store', () => {
  const state = {
    timeFormat: '24h',
    plainTextMode: false,
    subAddressDelimiter: '+',
    autoSelectReplyIdentity: true,
    attachmentReminderEnabled: false,
    attachmentReminderKeywords: [],
    sendDelaySeconds: 0,
    signaturePosition: 'above_quote',
    signatureSeparatorEnabled: false,
    requestReadReceiptDefault: false,
    addTrustedSender: () => {},
    trustedSendersAddressBook: null,
  };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useSettingsStore: hook };
});

vi.mock('@/stores/contact-store', () => {
  const state = {
    contacts: [],
    getAutocomplete: async () => [],
    addToTrustedSendersBook: async () => {},
  };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useContactStore: hook };
});

vi.mock('@/stores/template-store', () => {
  const state = { templates: [], addTemplate: async () => {} };
  const hook = (sel?: (s: typeof state) => unknown) =>
    typeof sel === 'function' ? sel(state) : state;
  hook.getState = () => state;
  hook.setState = (p: Partial<typeof state>) => Object.assign(state, p);
  return { useTemplateStore: hook };
});

// ─── Misc dependency mocks ────────────────────────────────────────────────────

vi.mock('@/stores/toast-store', () => ({
  toast: { info: () => {}, error: () => {}, success: () => {} },
}));

vi.mock('@/lib/plugin-hooks', () => ({
  emailHooks: {
    onComposerOpen: { call: async () => [] },
    onRecipientChange: { call: async () => [] },
    getRecipientSuggestions: { call: async () => [] },
    onSend: { call: async () => [] },
    beforeSend: { call: async () => [] },
  },
  contactHooks: {
    search: { call: async () => [] },
  },
}));

vi.mock('@/lib/email-sanitization', () => ({
  sanitizeSignatureHtml: (v: string) => v,
  sanitizeEmailHtml: (v: string) => v,
  parseHtmlSafely: (html: string) => new DOMParser().parseFromString(html, 'text/html'),
}));

vi.mock('@/lib/reply-identity', () => ({
  resolveReplyFrom: () => null,
  findComposeIdentityId: () => null,
}));
vi.mock('@/lib/email-threading', () => ({
  computeReplyThreadingHeaders: () => ({ inReplyTo: [], references: [] }),
}));
vi.mock('@/lib/signature-utils', () => ({
  appendPlainTextSignature: (body: string) => body,
  getPlainTextSignature: () => '',
}));
vi.mock('@/lib/sub-addressing', () => ({ generateSubAddress: () => '' }));
vi.mock('@/lib/debug', () => ({ debug: () => {} }));
vi.mock('@/components/email/quoted-html', () => ({
  buildQuotedHtmlBlock: () => '',
  serializeEditorContent: () => '',
}));
vi.mock('@/lib/template-utils', () => ({ substitutePlaceholders: (s: string) => s }));

// ─── Shared test data ─────────────────────────────────────────────────────────

const EMPTY_DATA = {
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  body: '',
  showCc: true,
  showBcc: true,
  selectedIdentityId: null,
  subAddressTag: '',
  mode: 'compose' as const,
  draftId: null,
};

/** next-intl is mocked to return the key, so the Subject placeholder is
 * "subject_placeholder". Typing a subject flips the dirty flag synchronously
 * (recipient chips go through async plugin hooks — unreliable here). */
const makeDirty = () =>
  fireEvent.change(screen.getByPlaceholderText('subject_placeholder'), {
    target: { value: 'draft in progress' },
  });

function renderComposer() {
  const requestCloseRef: React.MutableRefObject<(() => void) | null> = { current: null };
  const onClose = vi.fn();
  const onCloseCancelled = vi.fn();
  render(
    <EmailComposer
      initialData={EMPTY_DATA}
      requestCloseRef={requestCloseRef}
      onClose={onClose}
      onCloseCancelled={onCloseCancelled}
    />
  );
  return { requestCloseRef, onClose, onCloseCancelled };
}

const requestClose = (ref: React.MutableRefObject<(() => void) | null>) =>
  act(() => { ref.current!(); });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmailComposer close guard (onCloseCancelled)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('clean composer closes immediately without dialog or cancel callback', () => {
    const { requestCloseRef, onClose, onCloseCancelled } = renderComposer();
    requestClose(requestCloseRef);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCloseCancelled).not.toHaveBeenCalled();
    expect(screen.queryByText('close_draft_title')).not.toBeInTheDocument();
  });

  it('dirty composer shows the close dialog instead of closing', () => {
    const { requestCloseRef, onClose } = renderComposer();
    makeDirty();
    requestClose(requestCloseRef);
    expect(screen.getByText('close_draft_title')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Cancel button fires onCloseCancelled and keeps the composer open', () => {
    const { requestCloseRef, onClose, onCloseCancelled } = renderComposer();
    makeDirty();
    requestClose(requestCloseRef);
    fireEvent.click(screen.getByText('cancel'));
    expect(onCloseCancelled).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('close_draft_title')).not.toBeInTheDocument();
  });

  it('dialog backdrop click also fires onCloseCancelled', () => {
    const { requestCloseRef, onClose, onCloseCancelled } = renderComposer();
    makeDirty();
    requestClose(requestCloseRef);
    const backdrop = screen.getByRole('alertdialog').parentElement!;
    fireEvent.click(backdrop);
    expect(onCloseCancelled).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Discard closes without firing onCloseCancelled', () => {
    const { requestCloseRef, onClose, onCloseCancelled } = renderComposer();
    makeDirty();
    requestClose(requestCloseRef);
    fireEvent.click(within(screen.getByRole('alertdialog')).getByText('discard'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCloseCancelled).not.toHaveBeenCalled();
  });
});
