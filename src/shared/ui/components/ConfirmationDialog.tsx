import React from 'react';
import { Portal, Dialog, Paragraph, Button } from 'react-native-paper';
import { theme } from '../theme/theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss?: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = theme.colors.error,
  onConfirm,
  onCancel,
  onDismiss
}) => {
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      onCancel();
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>{cancelText}</Button>
          <Button 
            onPress={onConfirm} 
            mode="contained"
            buttonColor={confirmButtonColor}
            contentStyle={{
              marginLeft: 10,
              marginRight: 10,
            }}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}; 