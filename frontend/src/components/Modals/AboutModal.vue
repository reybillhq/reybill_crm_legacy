<template>
  <Dialog v-model:open="show" :size="'sm'" bare>
    <template #default>
      <div class="p-4 pt-5">
        <div class="flex justify-center">
          <div class="flex flex-col items-center">
            <CRMLogo wordmark class="mb-3 h-24 w-32" />
            <Dialog.Title as-child>
              <h3 class="text-2xl-semibold text-ink-gray-9">
                {{ branding.productName }}
              </h3>
            </Dialog.Title>
          </div>
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
            <span class="text-base text-ink-gray-8">
              {{ link.label }}
            </span>
          </a>
        </div>
        <hr class="border-t my-3 mx-2" />
        <p class="text-sm text-ink-gray-6 px-2 mt-2">
          {{ branding.productName }} is based on Frappe CRM. © Frappe
          Technologies Pvt. Ltd. and contributors. AGPLv3.
        </p>
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

let show = defineModel({ type: Boolean })

const links = [
  { label: __('Website'), url: branding.website, icon: LucideGlobe },
  { label: __('Source Code'), url: branding.sourceUrl, icon: GitHubIcon },
]
</script>
