<template>
  <SettingsLayoutBase :title="__('Legal Notices')">
    <template #content><LegalNoticesContent /></template>
  </SettingsLayoutBase>
</template>
<script setup>
import SettingsLayoutBase from '@/components/Layouts/SettingsLayoutBase.vue'
import LegalNoticesContent from '@/components/Settings/LegalNoticesContent.vue'
</script>
