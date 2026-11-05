<template>
  <Dialog v-model:open="show" size="2xl" bare>
    <template #default>
      <div class="flex max-h-[80dvh] flex-col p-6 sm:p-8">
        <div class="mb-6 flex items-center justify-between gap-4">
          <Dialog.Title as-child>
            <h2 class="text-2xl-semibold text-ink-gray-9">
              {{ __('Legal Notices') }}
            </h2>
          </Dialog.Title>
          <Button
            :aria-label="__('Close')"
            icon="x"
            variant="ghost"
            @click="show = false"
          />
        </div>
        <div class="min-h-0 overflow-y-auto pe-2"><LegalNoticesContent /></div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { Button, Dialog } from 'frappe-ui'
import LegalNoticesContent from '@/components/Settings/LegalNoticesContent.vue'
const show = defineModel({ type: Boolean })
</script>
