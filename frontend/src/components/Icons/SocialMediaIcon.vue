<template>
  <!-- eslint-disable vue/no-v-html -- Trusted static packaged icons, never user markup. -->
  <span
    aria-hidden="true"
    class="inline-flex [&>svg]:size-full"
    v-html="icons[platform]"
  />
</template>
<script setup>
// Trusted, packaged Feather artwork; no remote or configured SVG is injected.
import linkedin from 'feather-icons/dist/icons/linkedin.svg?raw'
import instagram from 'feather-icons/dist/icons/instagram.svg?raw'
import facebook from 'feather-icons/dist/icons/facebook.svg?raw'
import youtube from 'feather-icons/dist/icons/youtube.svg?raw'
import twitter from 'feather-icons/dist/icons/twitter.svg?raw'
defineProps({ platform: { type: String, required: true } })
const icons = { linkedin, instagram, facebook, youtube, x: twitter }
</script>
