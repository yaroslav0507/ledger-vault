import React, { useRef } from 'react';
import { Button, FAB } from 'react-native-paper';
import { Platform, ViewStyle, TextStyle } from 'react-native';

interface ImportButtonProps {
  onFileSelect: (file: File) => void;
  variant?: 'button' | 'fab';
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  icon?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export const ImportButton: React.FC<ImportButtonProps> = ({
  onFileSelect,
  variant = 'button',
  disabled = false,
  loading = false,
  label = 'Import File',
  icon = 'upload',
  style,
  contentStyle,
  labelStyle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  if (variant === 'fab') {
    return (
      <>
        <FAB
          icon={icon}
          onPress={handlePress}
          disabled={disabled || loading}
          loading={loading}
          style={{ position: 'absolute', bottom: 16, right: 16 }}
        />
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button
        mode="contained"
        icon={icon}
        onPress={handlePress}
        disabled={disabled || loading}
        loading={loading}
        style={style}
        contentStyle={contentStyle}
        labelStyle={labelStyle}
      >
        {label}
      </Button>
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}
    </>
  );
}; 