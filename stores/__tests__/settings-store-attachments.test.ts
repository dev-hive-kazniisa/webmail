import { beforeEach, describe, expect, it } from 'vitest';
import {
  useSettingsStore,
  migrateSettings,
  SETTINGS_STORE_VERSION,
} from '../settings-store';

describe('settings-store attachment action', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('defaults to preview when settings are reset', () => {
    expect(useSettingsStore.getState().mailAttachmentAction).toBe('preview');
  });

  it('defaults attachment position to below-header (above the message body)', () => {
    expect(useSettingsStore.getState().attachmentPosition).toBe('below-header');
  });

  it('includes the attachment action in exported settings', () => {
    useSettingsStore.getState().updateSetting('mailAttachmentAction', 'download');

    const exported = JSON.parse(useSettingsStore.getState().exportSettings()) as {
      mailAttachmentAction?: string;
    };

    expect(exported.mailAttachmentAction).toBe('download');
  });

  it('includes calendar invitation parsing in exported settings', () => {
    useSettingsStore.getState().updateSetting('calendarInvitationParsingEnabled', false);

    const exported = JSON.parse(useSettingsStore.getState().exportSettings()) as {
      calendarInvitationParsingEnabled?: boolean;
    };

    expect(exported.calendarInvitationParsingEnabled).toBe(false);
  });

  it('includes reply identity auto-selection in exported settings', () => {
    useSettingsStore.getState().updateSetting('autoSelectReplyIdentity', true);

    const exported = JSON.parse(useSettingsStore.getState().exportSettings()) as {
      autoSelectReplyIdentity?: boolean;
    };

    expect(exported.autoSelectReplyIdentity).toBe(true);
  });
});

describe('settings-store attachmentPosition v8 migration', () => {
  it('flips an existing user off the old beside-sender default', () => {
    const migrated = migrateSettings(
      { attachmentPosition: 'beside-sender' },
      5,
    ) as { attachmentPosition: string };

    expect(migrated.attachmentPosition).toBe('below-header');
  });

  it('leaves a deliberate below-header choice untouched', () => {
    const migrated = migrateSettings(
      { attachmentPosition: 'below-header' },
      5,
    ) as { attachmentPosition: string };

    expect(migrated.attachmentPosition).toBe('below-header');
  });

  it('still flips a v7 (upstream unified-mailbox) user off beside-sender', () => {
    // The flip is gated on `version < 8`, so users who only ever reached
    // upstream's v7 (the unified-mailbox rework) still receive our
    // below-header default on the v8 bump.
    const migrated = migrateSettings(
      { attachmentPosition: 'beside-sender' },
      7,
    ) as { attachmentPosition: string };

    expect(migrated.attachmentPosition).toBe('below-header');
  });

  it('does not re-run the flip once already at the current version', () => {
    // A user who has (re)chosen beside-sender at the current version must keep
    // it - the step is gated on `version < 8`.
    const migrated = migrateSettings(
      { attachmentPosition: 'beside-sender' },
      SETTINGS_STORE_VERSION,
    ) as { attachmentPosition: string };

    expect(migrated.attachmentPosition).toBe('beside-sender');
  });
});