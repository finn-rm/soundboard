<template>
    <v-container>
      <v-row>
        <v-col
          v-for="button in buttons"
          :key="button.id"
          cols="3"
        >
          <v-btn
            @click="handleButtonClick(button)"
            @contextmenu.prevent="clearButton(button)"
            class="button-grid"
            large
          >
            {{ button.displayText || 'Unassigned' }}
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
  import { useEventsBus } from '../useEventBus.js';
  
  interface Button {
    id: number;
    label: string;
    file: string | null;
    displayText: string | null;
  }
  
  export default defineComponent({
    data() {
      return {
        buttons: [
          { id: 5, label: 'Unassigned', file: null, displayText: '' },
          { id: 6, label: 'Unassigned', file: null, displayText: '' },
          { id: 7, label: 'Unassigned', file: null, displayText: '' },
          { id: 8, label: 'Unassigned', file: null, displayText: '' },
          { id: 9, label: 'Unassigned', file: null, displayText: '' },
          { id: 10, label: 'Unassigned', file: null, displayText: '' },
          { id: 11, label: 'Unassigned', file: null, displayText: '' },
          { id: 12, label: 'Unassigned', file: null, displayText: '' },
          { id: 13, label: 'Unassigned', file: null, displayText: '' },
          { id: 14, label: 'Unassigned', file: null, displayText: '' },
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
            useEventsBus().emit('select-song', { clickedBtn: button, buttons: this.buttons});
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
          const displayText = prompt('Enter a short display text for the song:');
          this.currentButton.label = file;
          this.currentButton.file = `/music/${file}`;
          this.currentButton.displayText = displayText;
          this.dialog = false;
          useEventsBus().emit('set-song', { clickedBtn: this.currentButton, buttons: this.buttons});
        }
      },
      clearButton(button: Button) {
        button.label = 'Unassigned';
        button.file = null;
        button.displayText = '';
        useEventsBus().emit('set-song', { clickedBtn: this.currentButton, buttons: this.buttons});
      },
    },
  });
  </script>
  
  <style scoped>
  .button-grid {
    height: 100px; /* Adjust height as needed */
  }
  </style>
  