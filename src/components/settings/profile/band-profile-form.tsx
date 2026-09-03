'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCamera } from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Grid,
  Group,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { bandsRepository } from '@/features/bands';
import { useBandContext } from '@/hooks/use-band-context';
import { BAND_PERMISSIONS, hasBandPermission } from '@/utils/band-permissions';
import { getApiErrorMessage, uploadFileToStorage } from '@/utils/http';

const ALLOWED_AVATAR_TYPES = 'image/png,image/jpeg,image/webp';

interface BandProfileFormValues {
  bio: string;
  city: string;
  genres: string[];
  instagram: string;
  facebook: string;
  youtube: string;
  spotify: string;
  tiktok: string;
  website: string;
}

export const BandProfileForm = () => {
  const { activeBand, refetch } = useBandContext();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BandProfileFormValues>({
    initialValues: {
      bio: '',
      city: '',
      genres: [],
      instagram: '',
      facebook: '',
      youtube: '',
      spotify: '',
      tiktok: '',
      website: '',
    },
  });

  useEffect(() => {
    if (!activeBand) {
      return;
    }

    form.setInitialValues({
      bio: activeBand.bio ?? '',
      city: activeBand.city ?? '',
      genres: activeBand.genres ?? [],
      instagram: activeBand.socials?.instagram ?? '',
      facebook: activeBand.socials?.facebook ?? '',
      youtube: activeBand.socials?.youtube ?? '',
      spotify: activeBand.socials?.spotify ?? '',
      tiktok: activeBand.socials?.tiktok ?? '',
      website: activeBand.socials?.website ?? '',
    });
    form.reset();
  }, [activeBand?.id]);

  if (!activeBand) {
    return null;
  }

  const canWrite = hasBandPermission(
    activeBand.membership.role,
    BAND_PERMISSIONS.BAND_PROFILE_WRITE
  );

  const handleSave = async (values: BandProfileFormValues) => {
    setSaving(true);
    try {
      await bandsRepository.updateProfile(activeBand.id, {
        bio: values.bio.trim() || null,
        city: values.city.trim() || null,
        genres: values.genres,
        socials: {
          instagram: values.instagram.trim() || null,
          facebook: values.facebook.trim() || null,
          youtube: values.youtube.trim() || null,
          spotify: values.spotify.trim() || null,
          tiktok: values.tiktok.trim() || null,
          website: values.website.trim() || null,
        },
      });
      showNotification({ message: 'Band profile updated successfully.', color: 'green' });
      await refetch();
    } catch (error) {
      showNotification({
        message: getApiErrorMessage(error, 'Unable to update band profile. Please try again.'),
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const { key, uploadUrl } = await bandsRepository.requestAvatarUploadUrl(activeBand.id, {
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      });

      await uploadFileToStorage(uploadUrl, file);
      await bandsRepository.commitAvatar(activeBand.id, key);

      showNotification({ message: 'Band avatar updated successfully.', color: 'green' });
      await refetch();
    } catch (error) {
      showNotification({
        message: getApiErrorMessage(error, 'Unable to update band avatar. Please try again.'),
        color: 'red',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <Stack maw={600}>
      <Group>
        <Box pos="relative" w="fit-content">
          <Avatar size="lg" radius="xl" src={activeBand.image ?? undefined} />
          {canWrite ? (
            <Tooltip label="Change band avatar">
              <ActionIcon
                disabled={uploadingAvatar}
                loading={uploadingAvatar}
                variant="filled"
                size="sm"
                radius="xl"
                pos="absolute"
                bottom={-2}
                right={-2}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconCamera size={14} />
              </ActionIcon>
            </Tooltip>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES}
            style={{ display: 'none' }}
            onChange={handleAvatarFileSelected}
          />
        </Box>
        <Title mx={12} order={4}>
          {activeBand.name}
        </Title>
      </Group>

      {!canWrite ? (
        <Text size="sm" c="dimmed">
          Only band admins can edit the band profile.
        </Text>
      ) : null}

      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack>
          <Textarea
            disabled={!canWrite || saving}
            label="Bio"
            autosize
            minRows={2}
            {...form.getInputProps('bio')}
          />
          <TextInput disabled={!canWrite || saving} label="City" {...form.getInputProps('city')} />
          <TagsInput
            disabled={!canWrite || saving}
            label="Genres"
            maxTags={10}
            {...form.getInputProps('genres')}
          />

          <Title order={6} mt="sm">
            Socials
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="Instagram"
                {...form.getInputProps('instagram')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="Facebook"
                {...form.getInputProps('facebook')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="YouTube"
                {...form.getInputProps('youtube')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="Spotify"
                {...form.getInputProps('spotify')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="TikTok"
                {...form.getInputProps('tiktok')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                disabled={!canWrite || saving}
                label="Website"
                {...form.getInputProps('website')}
              />
            </Grid.Col>
          </Grid>

          {canWrite ? (
            <Button type="submit" loading={saving}>
              Save band profile
            </Button>
          ) : null}
        </Stack>
      </form>
    </Stack>
  );
};
