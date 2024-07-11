import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { requestStreamDecks, getStreamDecks, StreamDeckWeb as BaseStreamDeckWeb, LcdPosition } from '@elgato-stream-deck/webhid';
import jpegJS from 'jpeg-js'
import axios from 'axios';
import mitt from 'mitt';

const emitter = mitt();
App.config.globalProperties.emitter = emitter;

createApp(App)
  .use(vuetify)
  .mount('#app');

// Extend the StreamDeckWeb interface to include required methods
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

const consentButton = document.getElementById('consent-button');

let device: StreamDeckWeb | null = null;

async function loadImage(filePath: string, tileIndex: number, device: StreamDeckWeb){
    // Fetch and decode the image
    try {
        const response = await axios.get(filePath, { responseType: 'arraybuffer' });
        const rawFile = Buffer.from(response.data);
        const decodedImage = jpegJS.decode(rawFile, { useTArray: true });

        // Here, `decodedImage` contains the raw image data
        // Convert this data to the appropriate format if needed and use it
        const img = Buffer.from(decodedImage.data.buffer);

        // Example usage:
        await device.fillKeyBuffer(tileIndex, img, { format: 'rgba' });
    } catch (error) {
        console.error('Error loading or decoding the image:', error);
    }
}

async function openDevice(device: StreamDeckWeb): Promise<void> {
    appendLog(`Device opened. Serial: ${await device.getSerialNumber()} Firmware: ${await device.getFirmwareVersion()}`);

	device.clearPanel()

    loadImage('play_72x72.jpg', 0, device);
    loadImage('pause_72x72.jpg', 1, device);
    loadImage('stop_72x72.jpg', 2, device);
    loadImage('fade_72x72_selected.jpg', 3, device);
    loadImage('cut_72x72.jpg', 4, device);

    // Create an instance of Audio
    const audio = new Audio('/song1.mp3');

    // Variable to track if the audio is currently paused
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

    const fadeOut = (resetTime: boolean) => {
        const fadeAudio = setInterval(() => {
            if (audio.volume > 0) {
                audio.volume = Math.max(0, audio.volume - 0.05);
            } else {
                clearInterval(fadeAudio);
                audio.pause();
                if (resetTime) { audio.currentTime = 0; }
            }
        }, 100);
    };

    device.on('down', (key: number) => {
        appendLog(`Key ${key} down`);

        switch (key) {
            case 0:
                // Play the audio
                if (fadeInState) {
                    fadeIn();
                    console.log('FADINNNN')
                } else {
                    console.log("APLAYINNNN")
                    audio.volume = 1;
                    audio.play();
                }
                isPaused = false;
                break;
            case 1:
                // Pause the audio
                if (!audio.paused) {
                    if (fadeInState) {
                        fadeOut(false);
                        console.log('FADINNNN')
                    } else {
                        audio.pause();
                        isPaused = true;
                    }
                    
                }
                break;
            case 2:
                // Stop the audio
                if (fadeInState) {
                    fadeOut(true);
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
                break;
        }
    });

    // Sample actions
    await device.setBrightness(70);

}

if (consentButton) {
    const doLoad = async () => {
        // attempt to open a previously selected device.
        const devices = await getStreamDecks();
        if (devices.length > 0) {
            device = devices[0] as StreamDeckWeb;
            openDevice(device).catch(console.error);
        }
        console.log(devices);
    };

    window.addEventListener('load', () => {
        doLoad().catch((e) => console.error(e));
    });

    const brightnessRange = document.getElementById('brightness-range') as HTMLInputElement | undefined;
    if (brightnessRange) {
        brightnessRange.addEventListener('input', (_e) => {
            const value = brightnessRange.value as any as number;
            if (device) {
                device.setBrightness(value).catch(console.error);
            }
        });
    }

    const consentClick = async () => {
        if (device) {
            appendLog('Closing device');
            await device.close();
            device = null;
        }
        // Prompt for a device
        try {
            const devices = await requestStreamDecks();
            device = devices[0] as StreamDeckWeb;
            if (devices.length === 0) {
                appendLog('No device was selected');
                return;
            }
        } catch (error) {
            appendLog(`No device access granted: ${error as string}`);
            return;
        }

        openDevice(device).catch(console.error);
    };
    consentButton.addEventListener('click', () => {
        consentClick().catch((e) => console.error(e));
    });

    appendLog('Page loaded');
}
