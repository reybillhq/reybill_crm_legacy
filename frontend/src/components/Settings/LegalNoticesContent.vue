<template>
  <div class="space-y-6 text-p-base text-ink-gray-7" data-legal-notices>
    <section class="space-y-2">
      <h3 class="text-lg-semibold text-ink-gray-9">
        {{ branding.productName }}
      </h3>
      <p>
        © {{ branding.companyName }} {{ __('and respective contributors.') }}
      </p>
    </section>
    <section class="space-y-2">
      <h3 class="text-base-semibold text-ink-gray-9">
        {{ __('Open Source Licensing') }}
      </h3>
      <p>
        {{
          __(
            '{0} includes open-source software and is distributed under the GNU Affero General Public License, version 3 (AGPLv3).',
            [branding.productName]
          )
        }}
      </p>
      <p>
        {{
          __(
            'You may copy, modify and redistribute the software under this license.'
          )
        }}
      </p>
      <p>
        {{
          __(
            'The software is provided without warranty except where separately agreed in writing.'
          )
        }}
      </p>
    </section>
    <section class="space-y-2">
      <h3 class="text-base-semibold text-ink-gray-9">
        {{ __('License Information') }}
      </h3>
      <a
        class="notice-link"
        :href="licenseUrl"
        target="_blank"
        rel="noopener noreferrer"
        >{{ __('View License') }}</a
      >
      <a
        class="notice-link"
        :href="sourceArchiveUrl"
        target="_blank"
        rel="noopener noreferrer"
        >{{ __('Access Corresponding Source') }}</a
      >
      <a
        class="notice-link"
        :href="thirdPartyUrl"
        target="_blank"
        rel="noopener noreferrer"
        >{{ __('Third-Party Notices') }}</a
      >
    </section>
  </div>
</template>
<script setup>
import branding from '@/branding'
import {
  licenseUrl,
  thirdPartyUrl,
  sourceArchiveUrl,
} from '@/utils/legalNotices'
</script>
<style scoped>
.notice-link {
  @apply block w-fit max-w-full rounded-4 text-ink-gray-9 underline underline-offset-4 hover:text-ink-gray-6;
}
.notice-link:focus-visible {
  outline: 2px solid var(--reybill-primary);
  outline-offset: 2px;
}
</style>
