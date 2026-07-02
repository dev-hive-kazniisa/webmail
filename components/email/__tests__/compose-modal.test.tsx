import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComposeModal } from '../compose-modal';

/** next-intl is mocked globally in vitest.setup (t returns the bare key),
 *  so aria-labels resolve to 'minimize', 'maximize', 'restore_size', 'close'. */
function renderModal(overrides: Record<string, unknown> = {}) {
  const props = {
    minimized: false,
    maximized: false,
    title: 'Test subject',
    onMinimize: vi.fn(),
    onRestore: vi.fn(),
    onToggleMaximize: vi.fn(),
    onRequestClose: vi.fn(),
    ...overrides,
  };
  const utils = render(
    <ComposeModal {...props}>
      <div data-testid="composer-child" />
    </ComposeModal>
  );
  return { props, ...utils };
}

describe('ComposeModal', () => {
  it('renders children inside the panel when open', () => {
    renderModal();
    expect(screen.getByTestId('composer-child')).toBeInTheDocument();
  });

  it('minimize button calls onMinimize', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByLabelText('minimize'));
    expect(props.onMinimize).toHaveBeenCalledOnce();
  });

  it('backdrop click minimizes and never closes', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByTestId('compose-modal-backdrop'));
    expect(props.onMinimize).toHaveBeenCalledOnce();
    expect(props.onRequestClose).not.toHaveBeenCalled();
  });

  it('maximize button calls onToggleMaximize', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByLabelText('maximize'));
    expect(props.onToggleMaximize).toHaveBeenCalledOnce();
  });

  it('shows restore_size label when maximized', () => {
    renderModal({ maximized: true });
    expect(screen.getByLabelText('restore_size')).toBeInTheDocument();
  });

  it('keeps children mounted while minimized', () => {
    renderModal({ minimized: true });
    expect(screen.getByTestId('composer-child')).toBeInTheDocument();
  });

  it('minimized bar shows the title and restores on click', () => {
    const { props } = renderModal({ minimized: true });
    fireEvent.click(screen.getByText('Test subject'));
    expect(props.onRestore).toHaveBeenCalledOnce();
  });

  it('minimized bar X requests dirty-aware close', () => {
    const { props } = renderModal({ minimized: true });
    fireEvent.click(screen.getByLabelText('close'));
    expect(props.onRequestClose).toHaveBeenCalledOnce();
  });

  it('does not render the minimized bar while open', () => {
    renderModal();
    expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
  });
});
