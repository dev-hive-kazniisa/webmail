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
    fireEvent.click(screen.getByTestId('compose-minimized-close'));
    expect(props.onRequestClose).toHaveBeenCalledOnce();
  });

  it('does not render the minimized bar while open', () => {
    renderModal();
    expect(screen.queryByTestId('compose-minimized-close')).not.toBeInTheDocument();
  });

  it('renders a close control in the window controls, rightmost of the group', () => {
    renderModal();
    const close = screen.getByTestId('compose-window-close');
    const maximize = screen.getByLabelText('maximize');
    expect(close).toBeInTheDocument();
    // Close follows minimize/maximize in DOM order → rightmost in the flex row.
    expect(
      maximize.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('window-control close requests dirty-aware close', () => {
    const { props } = renderModal();
    fireEvent.click(screen.getByTestId('compose-window-close'));
    expect(props.onRequestClose).toHaveBeenCalledOnce();
  });

  it('traps initial focus inside the window when open', () => {
    renderModal();
    // useFocusTrap focuses the first focusable element (the minimize control).
    expect(screen.getByLabelText('minimize')).toHaveFocus();
  });

  it('Tab from the last focusable element wraps back to the first', () => {
    const props = {
      minimized: false,
      maximized: false,
      title: 'Test subject',
      onMinimize: vi.fn(),
      onRestore: vi.fn(),
      onToggleMaximize: vi.fn(),
      onRequestClose: vi.fn(),
    };
    render(
      <ComposeModal {...props}>
        <button data-testid="last-in-panel">send</button>
      </ComposeModal>
    );
    const first = screen.getByLabelText('minimize');
    const last = screen.getByTestId('last-in-panel');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('does not hold focus while minimized', () => {
    renderModal({ minimized: true });
    expect(screen.getByLabelText('minimize')).not.toHaveFocus();
  });
});
