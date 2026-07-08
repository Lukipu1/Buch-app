import React from 'react';
import { TextInputProps } from 'react-native';

import { Input } from './Input';

interface SearchInputProps
  extends Omit<TextInputProps, 'style' | 'autoCorrect' | 'autoCapitalize'> {
  value: string;
  onChangeText: (text: string) => void;
}

/**
 * Search-styled text field: a thin wrapper around `Input` with a magnifier
 * icon and search-friendly defaults (no autocorrect, clear button).
 */
export function SearchInput({
  placeholder = 'Suchen',
  ...rest
}: SearchInputProps) {
  return (
    <Input
      icon="search"
      placeholder={placeholder}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      clearButtonMode="while-editing"
      {...rest}
    />
  );
}
