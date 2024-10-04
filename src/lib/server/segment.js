import { Analytics } from '@segment/analytics-node';
const analytics = new Analytics({ writeKey: 'UcGP86mQieyWtTpmWMGzWAp0KaE9S2Rg' });
import { nanoid } from 'nanoid';

export const trackEvent = (userId, event, properties) => {
  if (userId) {
    analytics.track({
      userId,
      event,
      properties
    });
  } else {
    analytics.track({
      anonymousId: nanoid(),
      event,
      properties
    });
  }
}