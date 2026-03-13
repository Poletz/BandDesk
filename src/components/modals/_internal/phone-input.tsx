'use client';

import { ReactNode } from 'react';
import PhoneInput from 'react-phone-number-input';
import { Input } from '@mantine/core';
import classes from './css/phone-input.module.css';

type Props = {
  label?: string;
  value?: string;
  error?: ReactNode;
  onChange: (value?: string) => void;
};

export function PhoneField({ label = 'Contact phone', value, error, onChange }: Props) {
  return (
    <Input.Wrapper label={label} error={error}>
      <div className={classes.root}>
        <PhoneInput
          international
          defaultCountry="IT"
          countryCallingCodeEditable={false}
          value={value}
          onChange={onChange}
          placeholder="Insert phone..."
          className={classes.phoneInput}
          data-error={error ? 'true' : 'false'}
        />
      </div>
    </Input.Wrapper>
  );
}
