<template>
  <div class="space-y-6 text-p-base text-ink-gray-7" data-legal-notices>
    <section class="space-y-2">
      <h3 class="text-base-semibold text-ink-gray-9">
        {{ __('Open Source Notices') }}
      </h3>
      <p>
        {{ branding.productName }} is a modified version of Frappe CRM. Original
        Frappe CRM source: © Frappe Technologies Pvt. Ltd. and contributors.
        ReyBill modifications: © {{ branding.companyName }}
      </p>
      <p>
        This software is licensed under the GNU Affero General Public License,
        version 3 (AGPLv3). You may copy, modify and redistribute it under that
        license. There is no warranty, except where separately provided in
        writing. Original copyright notices, author attribution and license
        terms remain in the corresponding source.
      </p>
      <a
        class="notice-link"
        :href="licenseUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ __('Read the GNU AGPLv3 license') }}
      </a>
    </section>
    <section class="space-y-2">
      <h3 class="text-base-semibold text-ink-gray-9">
        {{ __('Corresponding Source') }}
      </h3>
      <p>
        The complete source of this modified CRM, including build instructions,
        dependency lockfiles and installation scripts, is available at no
        charge.
      </p>
      <a
        class="notice-link"
        :href="sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ __('View Corresponding Source') }}
      </a>
      <a
        class="notice-link"
        :href="sourceArchiveUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ __('Download Source Archive') }}
      </a>
    </section>
    <section class="space-y-2">
      <h3 class="text-base-semibold text-ink-gray-9">
        {{ __('Third-party Licenses') }}
      </h3>
      <p>
        Bundled libraries retain their own copyright, license and notice terms.
        The notices below include license texts, package versions and source
        locations for the dependencies included in this frontend build.
      </p>
      <a
        class="notice-link"
        :href="thirdPartyUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ __('Read Third-party Notices') }}
      </a>
    </section>
  </div>
</template>
<script setup>
import branding from '@/branding'
import {
  licenseUrl,
  thirdPartyUrl,
  sourceUrl,
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
