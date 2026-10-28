import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Sheet } from './index';
import { renderWithProviders } from '@/testing';

describe('Sheet Component', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when visible is true', async () => {
    await renderWithProviders(
      <Sheet visible={true} onClose={onClose}>
        <Text>Sheet Content</Text>
      </Sheet>,
    );

    expect(screen.getByText('Sheet Content')).toBeTruthy();
  });

  it('triggers onClose when backdrop is pressed', async () => {
    await renderWithProviders(
      <Sheet visible={true} onClose={onClose}>
        <Text>Sheet Content</Text>
      </Sheet>,
    );

    const backdrop = screen.getByLabelText('Dismiss sheet');
    await fireEvent.press(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders expandable sheet with handle accessibility label', async () => {
    const onExpandChange = jest.fn();

    await renderWithProviders(
      <Sheet
        visible={true}
        onClose={onClose}
        expandable={true}
        onExpandChange={onExpandChange}
      >
        <Text>Expandable Content</Text>
      </Sheet>,
    );

    expect(screen.getByText('Expandable Content')).toBeTruthy();
    const handle = screen.getByLabelText('Expand sheet');
    expect(handle).toBeTruthy();

    await fireEvent.press(handle);
    expect(onExpandChange).toHaveBeenLastCalledWith(true);
  });

  it('hides handle when showHandle is false', async () => {
    await renderWithProviders(
      <Sheet visible={true} onClose={onClose} showHandle={false}>
        <Text>No Handle</Text>
      </Sheet>,
    );

    expect(screen.getByText('No Handle')).toBeTruthy();
    expect(screen.queryByLabelText('Expand sheet')).toBeNull();
  });
});
