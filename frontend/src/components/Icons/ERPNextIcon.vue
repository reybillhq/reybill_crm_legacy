<template>
  <span class="inline-flex shrink-0" role="img" :aria-label="branding.erpName">
    <img
      :src="branding.iconLight"
      alt=""
      class="h-full w-full object-contain dark:hidden"
    />
    <img
      :src="branding.iconDark"
      alt=""
      class="hidden h-full w-full object-contain dark:block"
    />
  </span>
</template>
<script setup>
import branding from '@/branding'
</script>
