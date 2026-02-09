import { DefaultMantineColor } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import classes from './notification.module.css';

export interface NotificationParams {
  message: string;
  title: string;
  duration: number | boolean;
  color: DefaultMantineColor;
  loading?: boolean;
  close?: boolean;
  onClose: ({ ...prop }) => void;
  onOpen: ({ ...prop }) => void;
  addClass: boolean;
}

export const showMessage = ({
  message,
  title,
  duration = 3000,
  color,
  loading,
  close,
  onClose,
  onOpen,
  addClass = false,
}: NotificationParams) => {
  return showNotification({
    message,
    title,
    autoClose: duration,
    color,
    loading,
    withCloseButton: close,
    onClose,
    onOpen,
    classNames: addClass ? classes : undefined,
  });
};
