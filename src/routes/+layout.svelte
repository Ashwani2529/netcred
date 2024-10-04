<script>
  import "../app.postcss";

  import { datadogRum } from '@datadog/browser-rum';

  datadogRum.init({
    applicationId: '0d36b199-5e9d-43f0-baa7-2a12daf32b2a',
    clientToken: 'pub31a9604c1b0e0619ec24bfb30fde1c06',
    site: 'datadoghq.com',
    service:'netcredential',
    env:'prod',
    version: '2.4.0', 
    sessionSampleRate:100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel:'allow'
  });
    
  datadogRum.startSessionReplayRecording();
</script>

<slot />