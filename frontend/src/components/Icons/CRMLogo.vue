<template>
  <span
    class="inline-flex shrink-0"
    role="img"
    :aria-label="wordmark ? branding.productName : branding.appName"
  >
    <template v-if="wordmark">
      <img
        :src="branding.logoLight"
        alt=""
        class="h-full w-full object-contain dark:hidden"
      />
      <img
        :src="branding.logoDark"
        alt=""
        class="hidden h-full w-full object-contain dark:block"
      />
    </template>
    <img
      v-else
      :src="branding.appIcon"
      alt=""
      class="h-full w-full object-contain"
    />
  </span>
</template>
<script setup>
import branding from '@/branding'
defineProps({ wordmark: { type: Boolean, default: false } })
</script>
