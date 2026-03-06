'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';

export interface NavbarLinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export const NavbarLink = ({ href, label, icon }: NavbarLinkProps) => {
  const path = usePathname();
  const active = path === href.split('?')[0];

  return (
    <UnstyledButton
      component={Link}
      href={href}
      w="100%"
      px="md"
      py="sm"
      bdrs="md"
      style={{
        backgroundColor: active ? 'var(--mantine-color-blue-light)' : 'transparent',
        color: active ? 'var(--mantine-color-blue-7)' : 'inherit',
      }}
    >
      <Group>
        <ThemeIcon variant={active ? 'transparent' : 'light'} color={active ? 'blue' : 'gray'}>
          {icon}
        </ThemeIcon>
        <Text fw={active ? 600 : 400}>{label}</Text>
      </Group>
    </UnstyledButton>
  );
};
