import type { Clock, LocationProvider } from '../domain/types';
export class BrowserClock implements Clock {
  constructor(private offset: () => number) {}
  now() {
    return Date.now() + this.offset();
  }
}
export const browserLocation: LocationProvider = {
  watch(onSample, onError) {
    if (!navigator.geolocation) {
      onError('Este navegador não oferece localização. Use o modo de demonstração.');
      return () => {};
    }
    const id = navigator.geolocation.watchPosition(
      (p) =>
        onSample({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        }),
      (e) =>
        onError(
          e.code === 1
            ? 'Localização não autorizada. Você pode permitir no navegador ou usar a demonstração.'
            : 'Não foi possível obter uma posição válida. Tente novamente ou use a demonstração.',
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible')
        navigator.geolocation.getCurrentPosition(
          (p) =>
            onSample({
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              accuracy: p.coords.accuracy,
              timestamp: p.timestamp,
            }),
          () =>
            onError(
              'Aguardando uma posição recente. A presença fica pausada até validar a localização.',
            ),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
        );
    }, 10000);
    return () => {
      navigator.geolocation.clearWatch(id);
      clearInterval(timer);
    };
  },
};
