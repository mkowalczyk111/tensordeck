export interface SttOptions {
  language: string;
  timeoutMs?: number;
  onPartialResult?: (text: string) => void;
  onListeningStateChange?: (listening: boolean) => void;
}

export interface SttService {
  startListening(options: SttOptions): Promise<string>;
  stopListening(): Promise<void>;
  isSupported(): boolean;
}

// Web browser STT using SpeechRecognition API
class WebSttService implements SttService {
  private recognition: any = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  startListening(options: SttOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) { reject(new Error('STT not supported')); return; }

      this.recognition = new SpeechRec();
      this.recognition.lang = options.language;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.continuous = true; // Keep listening until we stop it

      let finalResult = '';
      let resolved = false;
      let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
      const INACTIVITY_MS = 1000; // 1s of silence after last speech

      // Hard timeout as safety net
      const hardTimeout = setTimeout(() => {
        if (!resolved) this.recognition?.stop();
      }, options.timeoutMs || 15000);

      const finishWithResult = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(hardTimeout);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        options.onListeningStateChange?.(false);
        resolve(finalResult);
      };

      const resetInactivityTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          // User has been silent for 2s after speaking — stop
          this.recognition?.stop();
        }, INACTIVITY_MS);
      };

      this.recognition.onstart = () => options.onListeningStateChange?.(true);

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let hasFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalResult += event.results[i][0].transcript;
            hasFinal = true;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        options.onPartialResult?.(finalResult || interim);

        // After receiving a final result, start inactivity timer
        if (hasFinal) {
          resetInactivityTimer();
        }
      };

      this.recognition.onend = () => {
        finishWithResult();
      };

      this.recognition.onerror = (event: any) => {
        if (resolved) return;
        clearTimeout(hardTimeout);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        resolved = true;
        options.onListeningStateChange?.(false);
        if (event.error === 'no-speech' || event.error === 'aborted') resolve(finalResult || '');
        else reject(new Error(event.error));
      };

      this.recognition.start();
    });
  }

  async stopListening(): Promise<void> {
    this.recognition?.stop();
  }
}

// Capacitor native STT — placeholder
class CapacitorSttService implements SttService {
  isSupported(): boolean {
    return !!(window as any).Capacitor;
  }
  async startListening(_options: SttOptions): Promise<string> {
    console.warn('Capacitor STT not yet implemented, falling back');
    return '';
  }
  async stopListening(): Promise<void> { /* noop */ }
}

// Tauri native STT — placeholder
class TauriSttService implements SttService {
  isSupported(): boolean {
    return !!(window as any).__TAURI_INTERNALS__;
  }
  async startListening(_options: SttOptions): Promise<string> {
    console.warn('Tauri STT not yet implemented, falling back');
    return '';
  }
  async stopListening(): Promise<void> { /* noop */ }
}

export function getSttService(): SttService {
  if (typeof window !== 'undefined') {
    if ((window as any).__TAURI_INTERNALS__) return new TauriSttService();
    if ((window as any).Capacitor) return new CapacitorSttService();
  }
  return new WebSttService();
}
