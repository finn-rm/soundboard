<template>
    <v-container>
      <v-row>
        <v-col>
          <h1>Finn's webHID demo. <span id="version_str"></span></h1>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn id="consent-button" @click="selectDevice">Select device</v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-slider
            v-model="brightness"
            min="1"
            max="100"
            label="Brightness"
            thumb-label
            ticks="always"
            @input="updateBrightness"
          ></v-slider>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-card>
            <v-card-text>
              <div id="log" style="white-space: pre; background: #ffffff;"></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { requestStreamDecks, getStreamDecks, StreamDeckWeb as BaseStreamDeckWeb } from '@elgato-stream-deck/webhid';
  import axios from 'axios';
  import jpegJS from 'jpeg-js';
  import { useEventsBus } from '../useEventBus.js';
  
  let buttons: any;
  let currentlySelectedBtn: any;
  let lastPlayedBtn: any;
  let audio = new Audio('/song1.mp3');
  let globalDevice: StreamDeckWeb;
  
  useEventsBus().on('set-song', (payload: any) => {
    buttons = payload.buttons;
  
    loadText(payload.clickedBtn.displayText, globalDevice, payload.clickedBtn.id, false);
    // audio = new Audio(payload.clickedBtn.file);
  });

  useEventsBus().on('select-song', async (payload: any) => {
    await selectButton(payload.clickedBtn.id)
  });

  async function selectButton(key: any){
    const selectedButton: any | undefined = buttons.find((button: any) => button.id === key);
    const everyOtherButton: any[] = buttons.filter((button: any) => button.id !== key);

    if (selectedButton && selectedButton.file !== null) {
    await loadText(selectedButton.displayText, globalDevice, selectedButton.id, true);

    everyOtherButton.forEach(async (btn: any) => {
        await loadText(btn.displayText, globalDevice, btn.id, false);
    });

    currentlySelectedBtn = selectedButton;
    }
  }
  
  async function loadText(stringForScreen: string, device: StreamDeckWeb, tileIndex: number, highlight: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
  
    const ctx = canvas.getContext('2d');
    const ps: Array<Promise<void>> = [];
  
    if (ctx) {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Set the background to yellow if highlight is true
      if (highlight) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
  
      // Start with a font that's 80% as high as the button. maxWidth
      // is used on the stroke and fill calls below to scale down.
      ctx.font = `${canvas.height * 0.8}px "Arial"`;
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      ctx.strokeText(stringForScreen, 8, canvas.height * 0.9, canvas.width * 0.8);
      ctx.fillStyle = 'white';
      ctx.fillText(stringForScreen, 8, canvas.height * 0.9, canvas.width * 0.8);
  
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ps.push(device.fillKeyBuffer(tileIndex, Buffer.from(id.data), { format: 'rgba' }));
      ctx.restore();
    }
  
    await Promise.all(ps);
  }
  
  interface StreamDeckWeb extends BaseStreamDeckWeb {
    fillKeyBuffer(keyIndex: number, imageBuffer: Buffer, options?: any): Promise<void>;
    getSerialNumber(): Promise<string>;
    getFirmwareVersion(): Promise<string>;
  }
  
  function appendLog(str: string) {
    const logElm = document.getElementById('log');
    if (logElm) {
      logElm.textContent = `${str}\n${logElm.textContent ?? ''}`;
    }
  }
  
  export default defineComponent({
    name: 'WebHIDDemo',
    setup() {
      const brightness = ref(60);
      let device: StreamDeckWeb | null = null;
  
      const selectDevice = async () => {
        try {
          const devices = await requestStreamDecks();
          if (devices.length > 0) {
            device = devices[0] as StreamDeckWeb;
            await openDevice(device);
          } else {
            appendLog('No device was selected');
          }
        } catch (error) {
          appendLog(`No device access granted: ${error}`);
        }
      };
  
      const updateBrightness = async (value: number) => {
        if (device) {
          await device.setBrightness(value);
        }
      };
  
      const loadImage = async (filePath: string, tileIndex: number, device: StreamDeckWeb) => {
        try {
          const response = await axios.get(filePath, { responseType: 'arraybuffer' });
          const rawFile = Buffer.from(response.data);
          const decodedImage = jpegJS.decode(rawFile, { useTArray: true });
          const img = Buffer.from(decodedImage.data.buffer);
          await device.fillKeyBuffer(tileIndex, img, { format: 'rgba' });
        } catch (error) {
          console.error('Error loading or decoding the image:', error);
        }
      };
  
      const openDevice = async (device: StreamDeckWeb): Promise<void> => {
        appendLog(`Device opened. Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`);
        globalDevice = device;
        device.clearPanel();
        loadImage('play_72x72.jpg', 0, device);
        loadImage('pause_72x72.jpg', 1, device);
        loadImage('stop_72x72.jpg', 2, device);
        loadImage('fade_72x72_selected.jpg', 3, device);
        loadImage('cut_72x72.jpg', 4, device);
  
        let isPaused = false;
        let fadeInState = true;
  
        const fadeIn = () => {
          audio.volume = 0;
          audio.play();
          const fadeAudio = setInterval(() => {
            if (audio.volume < 1) {
              audio.volume = Math.min(1, audio.volume + 0.05);
            } else {
              clearInterval(fadeAudio);
            }
          }, 100);
        };
  
        const fadeOut = (resetTime: boolean): Promise<void> => {
          return new Promise((resolve) => {
            const fadeAudio = setInterval(() => {
              if (audio.volume > 0) {
                audio.volume = Math.max(0, audio.volume - 0.05);
              } else {
                clearInterval(fadeAudio);
                audio.pause();
                if (resetTime) {
                  audio.currentTime = 0;
                }
                resolve();
              }
            }, 100);
          });
        };
  
        device.on('down', async (key: number) => {
          appendLog(`Key ${key} down`);
          switch (key) {
            case 0:
              if (currentlySelectedBtn.file !== lastPlayedBtn?.file) {
                lastPlayedBtn = currentlySelectedBtn;
                if (fadeInState) {
                  await fadeOut(false);
                } else {
                    audio.pause();
                }
  
                audio = new Audio(currentlySelectedBtn.file);
                if (fadeInState) {
                  fadeIn();
                } else {
                  audio.volume = 1;
                  audio.play();
                }
                isPaused = false;
              } else {
                if (fadeInState) {
                  fadeIn();
                } else {
                  audio.volume = 1;
                  audio.play();
                }
                isPaused = false;
              }
              break;
            case 1:
              if (!audio.paused) {
                if (fadeInState) {
                  await fadeOut(false);
                } else {
                  audio.pause();
                  isPaused = true;
                }
              }
              break;
            case 2:
              if (fadeInState) {
                await fadeOut(true);
              } else {
                audio.pause();
                audio.currentTime = 0;
              }
              isPaused = false;
              break;
            case 3:
              fadeInState = true;
              loadImage('fade_72x72_selected.jpg', 3, device);
              loadImage('cut_72x72.jpg', 4, device);
              appendLog(`Fade In Mode enabled`);
              break;
            case 4:
              fadeInState = false;
              loadImage('fade_72x72.jpg', 3, device);
              loadImage('cut_72x72_selected.jpg', 4, device);
              appendLog(`Fade In Mode enabled`);
              break;
            default:
              selectButton(key);
          }
        });
  
        await device.setBrightness(70);
      };
  
      onMounted(async () => {
        const devices = await getStreamDecks();
        if (devices.length > 0) {
          device = devices[0] as StreamDeckWeb;
          await openDevice(device);
        }
      });
  
      return { brightness, selectDevice, updateBrightness };
    },
  });
  </script>
  
  <style scoped>
  #log {
    height: 200px; /* Adjust as needed */
    overflow-y: auto;
  }
  </style>
  