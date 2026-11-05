<template>
  <aside
    class="fixed z-50 right-0 w-80 max-w-[calc(100vw-2rem)] m-4 mt-16 p-3 flex flex-col gap-3 rounded-lg bg-surface-elevation-2 text-ink-gray-9 shadow-2xl border border-outline-gray-1"
    :class="minimize ? 'bottom-4' : 'top-0 max-h-[calc(100dvh-6rem)]'"
    :aria-label="__('Help')"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-base font-medium">{{
        brand.name || branding.productName
      }}</span>
      <div class="flex gap-1">
        <Button
          variant="ghost"
          :aria-label="minimize ? __('Expand') : __('Collapse')"
          @click="minimize = !minimize"
        >
          <span
            :class="
              minimize ? 'lucide-maximize size-4' : 'lucide-minimize size-4'
            "
            aria-hidden="true"
          />
        </Button>
        <Button variant="ghost" :aria-label="__('Close')" @click="show = false">
          <span class="lucide-x size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
    <div v-if="!minimize" class="overflow-y-auto">
      <OnboardingSteps
        v-if="!isOnboardingStepsCompleted"
        appName="frappecrm"
        :title="brand.name || branding.productName"
        :logo="CRMLogo"
        v-bind="$attrs"
      />
      <div v-else class="flex flex-col gap-3 p-2">
        <p>{{ __('All steps are completed successfully') }}</p>
        <Button :label="__('Reset onboarding steps')" @click="resetAll" />
      </div>
      <a
        :href="branding.website"
        target="_blank"
        rel="noopener noreferrer"
        class="block p-2 text-base underline"
        >{{ __('Website') }}</a
      >
    </div>
  </aside>
</template>
<script setup>
import { Button } from 'frappe-ui'
import OnboardingSteps from '@framework/ui/components/Onboarding/OnboardingSteps.vue'
import { minimize, useOnboarding } from '@framework/ui/components/Onboarding'
import { getSettings } from '@/stores/settings'
import CRMLogo from '@/components/Icons/CRMLogo.vue'
import branding from '@/branding'

defineOptions({ inheritAttrs: false })
const show = defineModel({ type: Boolean })
const { brand } = getSettings()
const { isOnboardingStepsCompleted, resetAll } = useOnboarding('frappecrm')
</script>
