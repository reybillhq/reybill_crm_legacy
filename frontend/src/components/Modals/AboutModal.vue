<template>
  <Dialog v-model:open="show" :size="'sm'" bare>
    <template #default>
      <div class="p-4 pt-5">
        <div class="flex flex-col items-center">
          <CRMLogo class="mb-3 size-20" />
          <Dialog.Title as-child>
            <h3 class="text-2xl-semibold text-ink-gray-9">
              {{ branding.productName }}
            </h3>
          </Dialog.Title>
          <p class="mt-2 text-base text-ink-gray-7" data-crm-version>
            {{
              version ? __('Version {0}', [version]) : __('Version unavailable')
            }}
          </p>
          <p class="mt-1 text-sm text-ink-gray-6">
            {{ branding.companyName }}
          </p>
        </div>
        <hr class="border-t my-3 mx-2" />
        <div>
          <a
            v-for="link in links"
            :key="link.label"
            class="flex py-2 px-2 hover:bg-surface-gray-1 rounded-4 cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
            :href="link.url"
          >
            <component
              :is="link.icon"
              v-if="link.icon"
              class="size-4 mr-2 text-ink-gray-7"
            />
            <span class="text-base text-ink-gray-8">{{ link.label }}</span>
          </a>
        </div>
        <hr class="border-t my-3 mx-2" />
        <p class="text-sm text-ink-gray-6 px-2 mt-2">
          © {{ branding.companyName }}
        </p>
        <details class="px-2 mt-3 text-sm text-ink-gray-6">
          <summary class="cursor-pointer">
            {{ __('Open Source Licenses') }}
          </summary>
          <p class="mt-2">
            {{ branding.productName }} is based on Frappe CRM. Original source:
            © Frappe Technologies Pvt. Ltd. and contributors. Licensed under the
            GNU Affero General Public License v3 (AGPLv3). Original copyright
            and third-party license notices are preserved in the source code.
          </p>
        </details>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import branding from '@/branding'
import CRMLogo from '@/components/Icons/CRMLogo.vue'
import GitHubIcon from '@/components/Icons/GitHubIcon.vue'
import LucideGlobe from '~icons/lucide/globe'
import { Dialog } from 'frappe-ui'

const show = defineModel({ type: Boolean })
const version = window.crm_version

const links = [
  { label: __('Website'), url: branding.website, icon: LucideGlobe },
  {
    label: __('GitHub Repository'),
    url: branding.repository,
    icon: GitHubIcon,
  },
  { label: __('Source Code'), url: branding.sourceUrl, icon: GitHubIcon },
  {
    label: __('Documentation'),
    url: branding.documentation,
    icon: LucideGlobe,
  },
  { label: __('Report an Issue'), url: branding.issues, icon: GitHubIcon },
  { label: __('Contact Support'), url: branding.support, icon: LucideGlobe },
].filter((link) => link.url)
</script>
