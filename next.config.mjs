import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withBundleAnalyzer(
  withNextIntl({
    reactStrictMode: false,
    experimental: {
      optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    },
  })
);
