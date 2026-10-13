'use client';

import { writeConsent } from './consent';

export default function CookieSettingsButton() {
  const resetConsent = () => {
    writeConsent(window.localStorage, null);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={resetConsent}
      className="cursor-pointer underline decoration-dotted underline-offset-4 hover:no-underline"
    >
      Cookie settings
    </button>
  );
}
