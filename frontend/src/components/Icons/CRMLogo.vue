<template>
  <span
    class="inline-flex shrink-0"
    role="img"
    :aria-label="branding.productName"
  >
    <img
      :src="wordmark ? branding.logoLight : branding.iconLight"
      alt=""
      class="h-full w-full object-contain dark:hidden"
    />
    <img
      :src="wordmark ? branding.logoDark : branding.iconDark"
      alt=""
      class="hidden h-full w-full object-contain dark:block"
    />
  </span>
</template>
<script setup>
import branding from '@/branding'
defineProps({ wordmark: { type: Boolean, default: false } })
</script>
