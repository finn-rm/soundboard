<template>
    <v-container>
      <v-row>
        <v-col
          v-for="button in buttons"
          :key="button.id"
          cols="2.1"
        >
          <v-btn
            @click="handleButtonClick(button)"
            class="button-grid"
            large
          >
            {{ button.label }}
          </v-btn>
        </v-col>
      </v-row>
  
      <v-dialog v-model="dialog" max-width="500px">
        <v-card>
          <v-card-title class="headline">Select a file</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="file in files"
                :key="file"
                @click="selectFile(file)"
              >
                <v-list-item-content>{{ file }}</v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="dialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import axios from 'axios';
  
  interface Button {
    id: number;
    label: string;
    file: string | null;
  }
  
  export default defineComponent({
    data() {
      return {
        buttons: [
          { id: 1, label: 'Unassigned', file: null },
          { id: 2, label: 'Unassigned', file: null },
          { id: 3, label: 'Unassigned', file: null },
          { id: 4, label: 'Unassigned', file: null },
          { id: 5, label: 'Unassigned', file: null },
          { id: 6, label: 'Unassigned', file: null },
          { id: 7, label: 'Unassigned', file: null },
          { id: 8, label: 'Unassigned', file: null },
          { id: 9, label: 'Unassigned', file: null },
          { id: 10, label: 'Unassigned', file: null },
        ] as Button[],
        dialog: false,
        files: [] as string[],
        currentButton: null as Button | null,
      };
    },
    methods: {
      async handleButtonClick(button: Button) {
        if (button.label === 'Unassigned') {
          this.currentButton = button;
          await this.fetchFiles();
          this.dialog = true;
        } else {
          console.log(`Playing ${button.file}`);
          // Implement the logic to play the file
        }
      },
      async fetchFiles() {
        try {
          const response = await axios.get('/music');
          this.files = response.data;
        } catch (error) {
          console.error('Error fetching files:', error);
        }
      },
      selectFile(file: string) {
        if (this.currentButton) {
          this.currentButton.label = file;
          this.currentButton.file = `/music/${file}`;
          this.dialog = false;
        }
      },
    },
  });
  </script>
  
  <style scoped>
  .button-grid {
    width: 100%;
    height: 100px; /* Adjust height as needed */
  }
  </style>
  