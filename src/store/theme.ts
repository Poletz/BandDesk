'use client';

import { Button, createTheme } from '@mantine/core';

export const theme = createTheme({
  /* Put your mantine theme override here */
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'xl',
      },
    }),
  },
});
