<template>
    <v-app>
      <v-main>
        <v-container>Hello Vuetify 3 with TypeScript!</v-container>
        <web-hid-demo />
        <file-upload />
        <button-grid />
      </v-main>
    </v-app>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import FileUpload from './components/FileUpload.vue';
  import ButtonGrid from './components/ButtonGrid.vue';
  import WebHidDemo from './components/WebHidDemo.vue';
  
  export default defineComponent({
    name: 'App',
    components: {
        FileUpload,
        ButtonGrid,
        WebHidDemo,
    },
  });
  </script>
  
  <style>
  @import '~vuetify/styles';
  </style>
  