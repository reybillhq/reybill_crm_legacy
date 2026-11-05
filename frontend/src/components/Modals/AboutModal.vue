<template>
  <Dialog v-model:open="show" size="md" bare>
    <template #default>
      <div class="relative px-6 pb-6 pt-10 sm:px-8 sm:pb-8" data-about-dialog>
        <button
          type="button"
          class="absolute end-3 top-3 flex size-8 items-center justify-center rounded-6 text-ink-gray-5 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--reybill-primary]"
          :aria-label="__('Close')"
          @click="show = false"
        >
          <LucideX class="size-4" aria-hidden="true" />
        </button>
        <div class="flex flex-col items-center text-center">
          <CRMLogo class="mb-5 size-16" />
          <Dialog.Title as-child>
            <h3 class="text-2xl-semibold text-ink-gray-9">
              {{ branding.productName }}
            </h3>
          </Dialog.Title>
          <p class="mt-2 text-sm text-ink-gray-6" data-crm-version>
            {{
              version ? __('Version {0}', [version]) : __('Version unavailable')
            }}
          </p>
          <p class="mt-2 text-base text-ink-gray-6">
            {{ branding.companyName }}
          </p>
        </div>
        <nav :aria-label="__('Product links')" class="mt-8 space-y-1">
          <a
            v-for="link in links"
            :key="link.label"
            class="group flex min-h-12 items-center gap-3 rounded-7 px-3 py-3 text-base text-ink-gray-8 transition-colors hover:bg-surface-gray-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--reybill-primary]"
            target="_blank"
            rel="noopener noreferrer"
            :href="link.url"
          >
            <component
              :is="link.icon"
              class="size-4 text-ink-gray-6"
              aria-hidden="true"
            />
            <span class="flex-1">{{ link.label }}</span>
            <LucideArrowUpRight
              class="size-4 text-ink-gray-4 group-hover:text-ink-gray-7"
              aria-hidden="true"
            />
          </a>
        </nav>
        <nav
          v-if="socialLinks.length"
          :aria-label="__('Social media')"
          class="mt-6 flex flex-wrap justify-center gap-2 border-t border-outline-gray-1 pt-5"
        >
          <a
            v-for="social in socialLinks"
            :key="social.platform"
            :href="social.url"
            :aria-label="social.label"
            :title="social.label"
            target="_blank"
            rel="noopener noreferrer"
            class="flex size-10 items-center justify-center rounded-full text-ink-gray-6 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--reybill-primary]"
          >
            <SocialMediaIcon :platform="social.platform" class="size-5" />
          </a>
        </nav>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import branding from '@/branding'
import { verifiedSocialLinks } from '@/utils/socialLinks'
import CRMLogo from '@/components/Icons/CRMLogo.vue'
import SocialMediaIcon from '@/components/Icons/SocialMediaIcon.vue'
import LucideGlobe from '~icons/lucide/globe'
import LucideBookOpen from '~icons/lucide/book-open'
import LucideLifeBuoy from '~icons/lucide/life-buoy'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideX from '~icons/lucide/x'
import { Dialog } from 'frappe-ui'

const show = defineModel({ type: Boolean })
const version = window.crm_version
const socialLinks = verifiedSocialLinks(branding.socialLinks)
const links = [
  { label: __('Website'), url: branding.website, icon: LucideGlobe },
  {
    label: __('Documentation'),
    url: branding.documentation,
    icon: LucideBookOpen,
  },
  { label: __('Contact Support'), url: branding.support, icon: LucideLifeBuoy },
]
</script>
