<template>
    <v-container>
      <v-form @submit.prevent="handleSubmit">
        <v-file-input
          v-model="file"
          label="Upload MP3"
          accept="audio/mpeg"
          prepend-icon="mdi-music-note"
          required
        ></v-file-input>
        <v-btn type="submit" color="primary">Upload</v-btn>
      </v-form>
      <v-alert v-if="message" type="success">{{ message }}</v-alert>
    </v-container>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import axios from 'axios';
  
  export default defineComponent({
    setup() {
      const file = ref<File | null>(null);
      const message = ref<string | null>(null);
  
      const handleSubmit = async () => {
        if (!file.value) return;
  
        const formData = new FormData();
        formData.append('file', file.value);
  
        try {
          const response = await axios.post('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          message.value = 'File uploaded successfully';
        } catch (error) {
          console.error('Error uploading file:', error);
          message.value = 'Error uploading file';
        }
      };
  
      return { file, handleSubmit, message };
    },
  });
  </script>
  
  <style scoped>
  .v-file-input {
    margin-bottom: 16px;
  }
  </style>
  