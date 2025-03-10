import React from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ColorValue,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { spacing } from '@/constants/Spacing';

export type TextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * TextInput component that follows the login screen style
 * 
 * Usage:
 * ```
 * <TextInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 * />
 * ```
 */
export function TextInput({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  ...rest
}: TextInputProps) {
  // Get theme colors
  const inputBackground = useThemeColor({}, 'inputBackground') as string;
  const inputBorder = useThemeColor({}, 'inputBorder') as string;
  const inputText = useThemeColor({}, 'inputText') as string;
  const inputPlaceholder = useThemeColor({}, 'inputPlaceholder') as string;
  const errorColor = useThemeColor({}, 'error') as string;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText variant="labelMedium" style={styles.label}>
          {label}
        </ThemedText>
      )}
      
      <RNTextInput
        style={[
          styles.input,
          { 
            backgroundColor: inputBackground as ColorValue,
            borderColor: error ? errorColor as ColorValue : inputBorder as ColorValue,
            color: inputText as ColorValue,
          },
          inputStyle,
        ]}
        placeholderTextColor={placeholderTextColor || (inputPlaceholder as ColorValue)}
        {...rest}
      />
      
      {error && (
        <ThemedText variant="caption" style={[styles.helper, { color: errorColor as ColorValue }]}>
          {error}
        </ThemedText>
      )}
      
      {helper && !error && (
        <ThemedText variant="caption" style={styles.helper}>
          {helper}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  helper: {
    marginTop: spacing.xs,
  },
}); 