/* Unfollow X — paste into the console on x.com. See README.md. */
(() => {
  // src/config.js
  var VERSION = "0.1.0";
  var APP_ID = "ux-app";
  var STYLE_ID = "ux-style";
  var STORAGE_KEY = "ux_state_v1";
  var CHECKPOINT_KEY = "ux_scan_v1";
  var LAST_SCAN_KEY = "ux_last_scan_v1";
  var STATE_TTL = 24 * 60 * 60 * 1e3;
  var BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  var UNFOLLOW_MUTATION_ID = "RjGnpAQuMmcqXSjoCR7t6w";
  var LEGACY_FOLLOWING_ID = "eWTmcJY3EMh-dxIR7CYTKw";
  var NEW_FOLLOWING_ID = "m7RabhcYnvy3hM1xuz30oA";
  var LEGACY_FOLLOWING_FEATURES = {
    rweb_video_screen_enabled: false,
    payments_enabled: false,
    profile_label_improvements_pcf_label_in_post_enabled: true,
    responsive_web_profile_redirect_enabled: false,
    rweb_tipjar_consumption_enabled: false,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: true,
    responsive_web_jetfuel_frame: false,
    responsive_web_grok_share_attachment_enabled: true,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    responsive_web_grok_show_grok_translated_post: false,
    responsive_web_grok_analysis_button_from_backend: true,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_grok_image_annotation_enabled: true,
    responsive_web_grok_community_note_auto_translation_is_enabled: false,
    responsive_web_enhance_cards_enabled: false
  };
  var DEFAULT_TIMINGS = {
    scanDelayMin: 1500,
    scanDelayMax: 2500,
    scanPauseEveryPages: 10,
    scanPauseMs: 1e4,
    usersPerRequest: 50,
    unfollowDelayMin: 12e3,
    unfollowDelayMax: 2e4,
    unfollowPauseEvery: 25,
    unfollowPauseMs: 3e5,
    maxUnfollows: 190
  };
  var COOLDOWN_MS = {
    rate: 15 * 60 * 1e3,
    blocked: 3 * 60 * 60 * 1e3
  };
  var SCAN_LIMITS = {
    maxUsers: 1e4,
    maxPages: 400,
    captureWaitMs: 15e3,
    navTimeoutMs: 1e4
  };
  var DEFAULT_FILTERS = {
    verified: true,
    protected: true,
    noAvatar: true,
    showHidden: false
  };
  var UNFOLLOW_PATHS = {
    mutation: `/i/api/graphql/${UNFOLLOW_MUTATION_ID}/unfollowUserMutation`,
    rest: "/i/api/1.1/friendships/destroy.json"
  };
  var TRANSPORTS = {
    mutation: "mutation",
    rest: "rest",
    ui: "ui"
  };
  var I18N = {
    en: {
      appTitle: "Unfollow X",
      subtitle: "Find accounts that do not follow you back.",
      scanBtn: "Scan now",
      scanning: "Scanning\u2026",
      loadingFollowing: "Loading your following list\u2026",
      liveFound: "{count} non-followers so far",
      liveWaiting: "Waiting for data\u2026",
      liveHint: "Keep this tab visible. X loads the list as you scroll.",
      captureWait: "Waiting for X to send the following request\u2026",
      domScanHint: "Scanning the visible list. Scroll the page if it stalls.",
      scanningPage: "Page {page} \xB7 {count} scanned",
      unverified: "Could not verify who follows you back. Unfollow is disabled for this scan.",
      resumeAfter: "Resume previous scan",
      showLastScan: "Show last scan",
      lastScanNotice: "Showing the last scan from {time}.",
      rescan: "Scan again",
      paused: "Paused",
      pause: "Pause",
      resume: "Resume",
      cancel: "Cancel",
      ofTotal: "{count} of {total}",
      ofUnknown: "{count} scanned",
      countFollowing: "Following: {count}",
      scanCompletedToast: "Scan complete: {count} non-followers.",
      scanFailed: "Scan failed.",
      retry: "Retry",
      goBack: "Back",
      search: "Search name or @handle",
      filterVerified: "Verified",
      filterProtected: "Protected",
      filterNoAvatar: "No avatar",
      filterShowHidden: "Show hidden",
      foundCount: "{count} non-followers",
      foundOne: "1 non-follower",
      foundNone: "No non-followers found",
      noMatches: "No accounts match these filters.",
      hide: "Hide",
      unhide: "Show",
      openProfile: "Open profile",
      copy: "Copy handle",
      copyAll: "Copy all",
      copiedToast: "Copied.",
      selectAll: "Select all",
      selectNone: "Clear selection",
      selectedCount: "{count} selected",
      unfollow: "Unfollow",
      unfollowConfirmTitle: "Unfollow {count} accounts?",
      unfollowConfirmBody: "This cannot be undone. The script waits 12\u201320 seconds between actions and pauses every 25 accounts.",
      unfollowConfirmBtn: "Unfollow {count}",
      unfollowing: "Unfollowing\u2026",
      currently: "Now: @{handle}",
      nextActionIn: "Next in {seconds}s",
      cooldownIn: "Cooling down: {time}",
      scanPause: "Pausing scan: {seconds}s",
      unfollowDoneTitle: "Done",
      unfollowDoneBody: "Unfollowed {ok}. Failed: {fail}. Remaining: {remaining}.",
      unfollowBlocked: "X blocked the action. Stop and try again later.",
      settings: "Settings",
      settingsTitle: "Timings & limits",
      settingsBody: "Slower is safer. Values are in seconds unless noted.",
      minScanDelay: "Min scan delay (s)",
      maxScanDelay: "Max scan delay (s)",
      scanPauseEvery: "Pause scan every N pages",
      scanPauseLength: "Scan pause (s)",
      usersPerRequest: "Users per request",
      minUnfollowDelay: "Min unfollow delay (s)",
      maxUnfollowDelay: "Max unfollow delay (s)",
      unfollowPauseEvery: "Pause every N unfollows",
      unfollowPauseLength: "Unfollow pause (s)",
      maxUnfollows: "Max unfollows per run",
      restoreDefaults: "Restore defaults",
      save: "Save",
      saved: "Saved.",
      settingsSaved: "Settings saved.",
      cookieMissing: "ct0 cookie not found. Log in to x.com and reload.",
      csrfMissing: "CSRF token missing. Reload x.com.",
      authRequired: "Log in to x.com first.",
      requestFailed: "Request failed ({status}).",
      tooManyRequests: "Rate limited. Try again at {time}.",
      sessionExpired: "Session expired. Reload x.com and log in.",
      scanBlocked: "X blocked the scan. Wait a few hours or use the DOM fallback.",
      networkError: "Network error. Check your connection and resume.",
      keepTabVisible: "Keep this tab visible while scanning.",
      resumeScan: "Resume scan",
      startOver: "Start over",
      partialTitle: "Scan paused",
      partialBody: "Scanned {count} accounts. You can resume later.",
      scanNotice: "Scanned {count} accounts.",
      close: "Close",
      langSwitch: "T\xFCrk\xE7e",
      minimize: "Minimize",
      expand: "Expand",
      langCode: "EN",
      pillScanning: "Scanning",
      pillUnfollowing: "Unfollowing",
      pillResults: "{count} non-followers",
      pillIdle: "Unfollow X",
      navigateHint: "Open your Following page to let X load the list.",
      manualHandle: "Your @handle",
      manualHandleBody: "We could not detect your profile. Enter your X handle (without @).",
      openFollowing: "Open Following",
      navFailed: "Could not open your Following page. Open {url} and paste again.",
      transportDowngrade: "Switched to the REST fallback.",
      uiFallback: "Switched to clicking the UI. Keep the tab visible.",
      noSelection: "Select at least one account.",
      capNotice: "This run is capped at {max} unfollows.",
      domEmpty: "No accounts found on the page. Open your Following page and try again.",
      unknownError: "Something went wrong.",
      pausedAt: "Paused at {count}.",
      resumeHint: "Checkpoint saved. Paste the script again to resume.",
      lastScanEmpty: "No previous scan found.",
      rateCooldown: "Rate limited. Cooldown until {time}.",
      blockedCooldown: "Blocked. Cooldown until {time}.",
      sourceApi: "API scan",
      sourceDom: "DOM scan",
      tabFollowing: "Following",
      tabFollowers: "Followers",
      heroTitle: "Who doesn't follow you back?",
      heroBody: "Scan your following list, review the accounts that don't follow you, then unfollow only the ones you choose.",
      safetyNote: "Nothing is unfollowed during a scan. Actions are capped and spaced out.",
      reviewHint: "Select the accounts you want to unfollow.",
      liveEmpty: "Found accounts will appear here.",
      unfollowHint: "Keep this tab visible. You can pause or cancel at any time.",
      doneSubtitle: "Review the summary, then scan again whenever you want.",
      hiddenCount: "{count} hidden",
      showHiddenCount: "Show {count} hidden",
      followsYou: "Follows you",
      unknown: "Unknown",
      protectedBadge: "Protected",
      hideUser: "Hide @{handle}",
      unhideUser: "Show @{handle}",
      openOnX: "Open on X",
      apiBadge: "API",
      domBadge: "DOM",
      checkpointLabel: "Saved checkpoint",
      lastScanLabel: "Last scan",
      settingsHint: "Changes apply to the next scan or run.",
      copyHandle: "Copy @{handle}",
      copiedHandles: "Copied {count} handles.",
      noHidden: "No hidden accounts.",
      selectHint: "Tip: use the filters to narrow the list first.",
      scanSourceHint: "Source: {source}",
      pausedHint: "The scan is paused. Resume when you are ready.",
      unfollowPausedHint: "The run is paused. Resume when you are ready."
    },
    tr: {
      appTitle: "Unfollow X",
      subtitle: "Seni geri takip etmeyenleri bul.",
      scanBtn: "Taramay\u0131 ba\u015Flat",
      scanning: "Taran\u0131yor\u2026",
      loadingFollowing: "Takip listen y\xFCkleniyor\u2026",
      liveFound: "\u015Eu ana kadar {count} takip etmeyen",
      liveWaiting: "Veri bekleniyor\u2026",
      liveHint: "Bu sekmeyi g\xF6r\xFCn\xFCr tut. X listeyi kayd\u0131rd\u0131k\xE7a y\xFCkler.",
      captureWait: "X'in takip listesi iste\u011Fi g\xF6ndermesi bekleniyor\u2026",
      domScanHint: "G\xF6r\xFCn\xFCr liste taran\u0131yor. Tak\u0131l\u0131rsa sayfay\u0131 kayd\u0131r.",
      scanningPage: "Sayfa {page} \xB7 {count} tarand\u0131",
      unverified: "Kimin seni geri takip etti\u011Fi do\u011Frulanamad\u0131. Bu tarama i\xE7in takipten \xE7\u0131karma kapal\u0131.",
      resumeAfter: "\xD6nceki taramaya devam et",
      showLastScan: "Son taramay\u0131 g\xF6ster",
      lastScanNotice: "{time} tarihli son tarama g\xF6steriliyor.",
      rescan: "Yeniden tara",
      paused: "Duraklat\u0131ld\u0131",
      pause: "Duraklat",
      resume: "Devam et",
      cancel: "\u0130ptal",
      ofTotal: "{count} / {total}",
      ofUnknown: "{count} tarand\u0131",
      countFollowing: "Takip edilen: {count}",
      scanCompletedToast: "Tarama bitti: {count} takip etmeyen.",
      scanFailed: "Tarama ba\u015Far\u0131s\u0131z.",
      retry: "Tekrar dene",
      goBack: "Geri",
      search: "\u0130sim veya @kullan\u0131c\u0131 ara",
      filterVerified: "Do\u011Frulanm\u0131\u015F",
      filterProtected: "Korumal\u0131",
      filterNoAvatar: "Avatars\u0131z",
      filterShowHidden: "Gizlenenleri g\xF6ster",
      foundCount: "{count} takip etmeyen",
      foundOne: "1 takip etmeyen",
      foundNone: "Takip etmeyen bulunamad\u0131",
      noMatches: "Bu filtrelerle e\u015Fle\u015Fen hesap yok.",
      hide: "Gizle",
      unhide: "G\xF6ster",
      openProfile: "Profili a\xE7",
      copy: "Kullan\u0131c\u0131 ad\u0131n\u0131 kopyala",
      copyAll: "Hepsini kopyala",
      copiedToast: "Kopyaland\u0131.",
      selectAll: "T\xFCm\xFCn\xFC se\xE7",
      selectNone: "Se\xE7imi temizle",
      selectedCount: "{count} se\xE7ili",
      unfollow: "Takipten \xE7\u0131k",
      unfollowConfirmTitle: "{count} hesaptan \xE7\u0131k\u0131ls\u0131n m\u0131?",
      unfollowConfirmBody: "Bu i\u015Flem geri al\u0131namaz. Script i\u015Flemler aras\u0131nda 12\u201320 saniye bekler ve her 25 hesapta bir duraklar.",
      unfollowConfirmBtn: "{count} takipten \xE7\u0131k",
      unfollowing: "Takipten \xE7\u0131k\u0131l\u0131yor\u2026",
      currently: "\u015Eu an: @{handle}",
      nextActionIn: "Sonraki: {seconds} sn",
      cooldownIn: "Bekleme: {time}",
      scanPause: "Tarama durakl\u0131yor: {seconds} sn",
      unfollowDoneTitle: "Bitti",
      unfollowDoneBody: "{ok} takipten \xE7\u0131k\u0131ld\u0131. Ba\u015Far\u0131s\u0131z: {fail}. Kalan: {remaining}.",
      unfollowBlocked: "X i\u015Flemi engelledi. Durdur ve daha sonra tekrar dene.",
      settings: "Ayarlar",
      settingsTitle: "S\xFCreler ve limitler",
      settingsBody: "Yava\u015F olan daha g\xFCvenli. Aksi belirtilmedik\xE7e de\u011Ferler saniye cinsindendir.",
      minScanDelay: "Min tarama beklemesi (sn)",
      maxScanDelay: "Maks tarama beklemesi (sn)",
      scanPauseEvery: "Her N sayfada duraklat",
      scanPauseLength: "Tarama duraklamas\u0131 (sn)",
      usersPerRequest: "\u0130stek ba\u015F\u0131na kullan\u0131c\u0131",
      minUnfollowDelay: "Min \xE7\u0131karma beklemesi (sn)",
      maxUnfollowDelay: "Maks \xE7\u0131karma beklemesi (sn)",
      unfollowPauseEvery: "Her N \xE7\u0131karmada duraklat",
      unfollowPauseLength: "\xC7\u0131karma duraklamas\u0131 (sn)",
      maxUnfollows: "\xC7al\u0131\u015Ft\u0131rma ba\u015F\u0131na maks \xE7\u0131karma",
      restoreDefaults: "Varsay\u0131lanlara d\xF6n",
      save: "Kaydet",
      saved: "Kaydedildi.",
      settingsSaved: "Ayarlar kaydedildi.",
      cookieMissing: "ct0 \xE7erezi bulunamad\u0131. x.com'a giri\u015F yap\u0131p sayfay\u0131 yenile.",
      csrfMissing: "CSRF token\u0131 yok. x.com'u yenile.",
      authRequired: "\xD6nce x.com'a giri\u015F yap.",
      requestFailed: "\u0130stek ba\u015Far\u0131s\u0131z ({status}).",
      tooManyRequests: "H\u0131z limiti. {time} sonra tekrar dene.",
      sessionExpired: "Oturum s\xFCresi doldu. x.com'u yenileyip giri\u015F yap.",
      scanBlocked: "X taramay\u0131 engelledi. Birka\xE7 saat bekle veya DOM yede\u011Fini kullan.",
      networkError: "A\u011F hatas\u0131. Ba\u011Flant\u0131n\u0131 kontrol edip devam et.",
      keepTabVisible: "Tarama s\u0131ras\u0131nda bu sekmeyi g\xF6r\xFCn\xFCr tut.",
      resumeScan: "Taramaya devam et",
      startOver: "Ba\u015Ftan ba\u015Fla",
      partialTitle: "Tarama duraklat\u0131ld\u0131",
      partialBody: "{count} hesap tarand\u0131. Daha sonra devam edebilirsin.",
      scanNotice: "{count} hesap tarand\u0131.",
      close: "Kapat",
      langSwitch: "English",
      minimize: "K\xFC\xE7\xFClt",
      expand: "Geni\u015Flet",
      langCode: "TR",
      pillScanning: "Taran\u0131yor",
      pillUnfollowing: "\xC7\u0131k\u0131l\u0131yor",
      pillResults: "{count} takip etmeyen",
      pillIdle: "Unfollow X",
      navigateHint: "X'in listeyi y\xFCklemesi i\xE7in takip etti\u011Fin sayfas\u0131n\u0131 a\xE7.",
      manualHandle: "@kullan\u0131c\u0131 ad\u0131n",
      manualHandleBody: "Profilin bulunamad\u0131. X kullan\u0131c\u0131 ad\u0131n\u0131 @ olmadan gir.",
      openFollowing: "Takip edilenleri a\xE7",
      navFailed: "Takip etti\u011Fin sayfas\u0131 a\xE7amad\u0131m. {url} adresini a\xE7\u0131p script'i tekrar yap\u0131\u015Ft\u0131r.",
      transportDowngrade: "REST yede\u011Fine ge\xE7ildi.",
      uiFallback: "Aray\xFCze t\u0131klama moduna ge\xE7ildi. Sekmeyi g\xF6r\xFCn\xFCr tut.",
      noSelection: "En az bir hesap se\xE7.",
      capNotice: "Bu \xE7al\u0131\u015Ft\u0131rma {max} takipten \xE7\u0131karma ile s\u0131n\u0131rl\u0131.",
      domEmpty: "Sayfada hesap bulunamad\u0131. Takip etti\u011Fin sayfay\u0131 a\xE7\u0131p tekrar dene.",
      unknownError: "Bir \u015Feyler ters gitti.",
      pausedAt: "{count}. hesapta duraklat\u0131ld\u0131.",
      resumeHint: "Kontrol noktas\u0131 kaydedildi. Devam etmek i\xE7in script'i tekrar yap\u0131\u015Ft\u0131r.",
      lastScanEmpty: "\xD6nceki tarama bulunamad\u0131.",
      rateCooldown: "H\u0131z limiti. {time} saatine kadar bekle.",
      blockedCooldown: "Engellendi. {time} saatine kadar bekle.",
      sourceApi: "API taramas\u0131",
      sourceDom: "DOM taramas\u0131",
      tabFollowing: "Takip edilenler",
      tabFollowers: "Takip\xE7iler",
      heroTitle: "Seni kim geri takip etmiyor?",
      heroBody: "Takip listeni tara, seni geri takip etmeyenleri incele ve sadece se\xE7tiklerini takipten \xE7\u0131kar.",
      safetyNote: "Tarama s\u0131ras\u0131nda hi\xE7bir hesap takipten \xE7\u0131kar\u0131lmaz. \u0130\u015Flemler s\u0131n\u0131rl\u0131 ve aral\u0131kl\u0131d\u0131r.",
      reviewHint: "Takipten \xE7\u0131kmak istedi\u011Fin hesaplar\u0131 se\xE7.",
      liveEmpty: "Bulunan hesaplar burada g\xF6r\xFCnecek.",
      unfollowHint: "Bu sekmeyi g\xF6r\xFCn\xFCr tut. \u0130stedi\u011Fin an duraklat\u0131p iptal edebilirsin.",
      doneSubtitle: "\xD6zeti incele, istedi\u011Finde yeniden tara.",
      hiddenCount: "{count} gizli",
      showHiddenCount: "{count} gizliyi g\xF6ster",
      followsYou: "Seni takip ediyor",
      unknown: "Bilinmiyor",
      protectedBadge: "Korumal\u0131",
      hideUser: "@{handle} hesab\u0131n\u0131 gizle",
      unhideUser: "@{handle} hesab\u0131n\u0131 g\xF6ster",
      openOnX: "X'te a\xE7",
      apiBadge: "API",
      domBadge: "DOM",
      checkpointLabel: "Kay\u0131tl\u0131 kontrol noktas\u0131",
      lastScanLabel: "Son tarama",
      settingsHint: "De\u011Fi\u015Fiklikler bir sonraki tarama veya \xE7al\u0131\u015Ft\u0131rmada ge\xE7erli olur.",
      copyHandle: "@{handle} kullan\u0131c\u0131 ad\u0131n\u0131 kopyala",
      copiedHandles: "{count} kullan\u0131c\u0131 ad\u0131 kopyaland\u0131.",
      noHidden: "Gizli hesap yok.",
      selectHint: "\u0130pucu: \xF6nce filtrelerle listeyi daralt.",
      scanSourceHint: "Kaynak: {source}",
      pausedHint: "Tarama duraklat\u0131ld\u0131. Haz\u0131r oldu\u011Funda devam et.",
      unfollowPausedHint: "\xC7al\u0131\u015Ft\u0131rma duraklat\u0131ld\u0131. Haz\u0131r oldu\u011Funda devam et."
    }
  };
  function makeT(language = "en") {
    const dict = I18N[language] || I18N.en;
    return function t(key, vars = {}) {
      const raw = dict[key] ?? I18N.en[key] ?? key;
      return String(raw).replace(
        /\{(\w+)\}/g,
        (match, name) => vars[name] === void 0 || vars[name] === null ? match : String(vars[name])
      );
    };
  }
  var ICONS = {
    gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.23.57.77.96 1.4 1H21a2 2 0 1 1 0 4h-.09c-.63.04-1.17.43-1.51 1Z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
    minimize: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>`,
    expand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`,
    external: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    alert: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.2v.1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-2.4 3.1M6.1 7.8A17 17 0 0 0 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-1"/></svg>`
  };

  // src/utils.js
  var HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
  }
  var escapeAttr = escapeHTML;
  function getCookie(name) {
    if (typeof document === "undefined" || !document.cookie) return "";
    const target = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${target}=([^;]*)`)
    );
    if (!match) return "";
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  function parseTwid(raw) {
    if (!raw) return "";
    let value = String(raw);
    try {
      value = decodeURIComponent(value);
    } catch {
    }
    const match = value.match(/(?:^|&)u=(\d+)/);
    return match ? match[1] : "";
  }
  function parseRetryAfter(value) {
    if (value === void 0 || value === null || value === "") return 0;
    const text = String(value).trim();
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      return Math.max(0, Number(text) * 1e3);
    }
    const date = Date.parse(text);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
    return 0;
  }
  function parseResetHeader(value) {
    if (value === void 0 || value === null || value === "") return 0;
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return 0;
    return number > 1e12 ? number : number * 1e3;
  }
  function retryDecision(status, json) {
    const code = Number(status) || 0;
    const message = String(
      json?.errors?.[0]?.message || json?.error || json?.message || ""
    );
    if (code === 429 || /rate limit|too many requests|try again later/i.test(message)) {
      return { kind: "rate", retry: false, cooldownMs: COOLDOWN_MS.rate };
    }
    if (code === 401 || /could not authenticate|require_login|unauthorized|not authorized/i.test(
      message
    )) {
      return { kind: "auth", retry: false, cooldownMs: 0 };
    }
    if (code === 403 || /blocked|challenge|spam|feedback|access denied|forbidden/i.test(message)) {
      return { kind: "blocked", retry: false, cooldownMs: COOLDOWN_MS.blocked };
    }
    if (code >= 500) {
      return { kind: "network", retry: true, cooldownMs: 5e3 };
    }
    if (code >= 200 && code < 300) {
      return { kind: "ok", retry: false, cooldownMs: 0 };
    }
    return { kind: "format", retry: false, cooldownMs: 0 };
  }
  function firstBoolean(...values) {
    for (const value of values) {
      if (typeof value === "boolean") return value;
    }
    return null;
  }
  function normalizeUser(raw) {
    if (!raw || typeof raw !== "object") return null;
    const legacy = raw.legacy || {};
    const core = raw.core || {};
    const avatarObj = raw.avatar || {};
    const handle = String(
      legacy.screen_name || core.screen_name || raw.screen_name || raw.handle || ""
    ).replace(/^@/, "").trim();
    if (!handle) return null;
    const id = String(
      raw.rest_id || raw.id_str || raw.id || raw.userId || ""
    ).trim();
    const name = String(
      legacy.name || core.name || raw.name || handle
    ).trim();
    return {
      id,
      handle,
      name,
      avatar: String(
        legacy.profile_image_url_https || avatarObj.image_url || raw.profile_image_url_https || raw.avatar || ""
      ),
      verified: Boolean(
        raw.is_blue_verified || legacy.verified || raw.verification?.verified || raw.verified
      ),
      protected: Boolean(
        legacy.protected ?? raw.privacy?.protected ?? raw.protected
      ),
      followsViewer: firstBoolean(
        raw.relationship_perspectives?.followed_by,
        legacy.followed_by,
        raw.followed_by
      )
    };
  }
  function dedupeUsers(list) {
    const out = [];
    const seenIds = /* @__PURE__ */ new Set();
    const seenHandles = /* @__PURE__ */ new Set();
    for (const user of Array.isArray(list) ? list : []) {
      if (!user || !user.handle) continue;
      const id = String(user.id || "");
      const handle = String(user.handle).toLowerCase();
      if (id && seenIds.has(id) || seenHandles.has(handle)) continue;
      if (id) seenIds.add(id);
      seenHandles.add(handle);
      out.push(user);
    }
    return out;
  }
  function isDefaultAvatar(user) {
    const url = String(user?.avatar || user?.profile_pic_url || "");
    if (!url) return true;
    return /default_profile|default-avatar|anonymousUser|sticky\/default_profile_images|\/egg\./i.test(
      url
    );
  }
  function randomBetween(min, max) {
    const lo = Number(min) || 0;
    const hi = Number(max) || 0;
    if (hi <= lo) return lo;
    return lo + Math.random() * (hi - lo);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }
  function clamp(value, min, max) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : min;
    return Math.min(max, Math.max(min, safe));
  }
  function safeJsonParse(text, fallback = null) {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }
  function timeAgo(timestamp, language = "en") {
    const then = Number(timestamp);
    if (!Number.isFinite(then) || then <= 0) return "";
    const diff = then - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(language === "tr" ? "tr" : "en", {
      numeric: "auto"
    });
    if (abs < 6e4) return rtf.format(Math.round(diff / 1e3), "second");
    if (abs < 36e5) return rtf.format(Math.round(diff / 6e4), "minute");
    if (abs < 864e5) return rtf.format(Math.round(diff / 36e5), "hour");
    return rtf.format(Math.round(diff / 864e5), "day");
  }
  function formatClock(timestamp) {
    const date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // src/storage.js
  var TTL = STATE_TTL;
  function defaultStorage() {
    try {
      return globalThis.localStorage || null;
    } catch {
      return null;
    }
  }
  function readJson(storage, key) {
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = safeJsonParse(raw, null);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  function writeJson(storage, key, value) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  function stripSets(value) {
    if (!value || typeof value !== "object") return value;
    const out = { ...value };
    for (const [key, item] of Object.entries(out)) {
      if (item instanceof Set) out[key] = [...item];
    }
    return out;
  }
  function loadState(storage = defaultStorage()) {
    const parsed = readJson(storage, STORAGE_KEY);
    if (!parsed) return {};
    return parsed;
  }
  function persistState(storage = defaultStorage(), partial = {}) {
    if (!storage) return false;
    const current = loadState(storage);
    const next = {
      ...current,
      ...stripSets(partial)
    };
    if (partial.timings && typeof partial.timings === "object") {
      next.timings = {
        ...current.timings || {},
        ...partial.timings
      };
    }
    return writeJson(storage, STORAGE_KEY, next);
  }
  function isFresh(savedAt) {
    const stamp = Number(savedAt);
    return Number.isFinite(stamp) && Date.now() - stamp < TTL && stamp <= Date.now() + 6e4;
  }
  function sameViewer(expected, actual) {
    if (!actual) return true;
    return String(expected || "").toLowerCase() === String(actual).toLowerCase();
  }
  function loadCheckpoint(storage = defaultStorage(), viewerHandle = "") {
    const cp = readJson(storage, CHECKPOINT_KEY);
    if (!cp) return null;
    if (!Array.isArray(cp.users)) return null;
    if (!isFresh(cp.savedAt)) return null;
    if (!sameViewer(viewerHandle, cp.viewerHandle)) return null;
    return cp;
  }
  function saveCheckpoint(storage = defaultStorage(), checkpoint = {}) {
    if (!storage) return false;
    const next = { ...checkpoint };
    if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
    return writeJson(storage, CHECKPOINT_KEY, next);
  }
  function clearCheckpoint(storage = defaultStorage()) {
    if (!storage) return false;
    try {
      storage.removeItem(CHECKPOINT_KEY);
      return true;
    } catch {
      return false;
    }
  }
  function loadLastScan(storage = defaultStorage(), viewerHandle = "") {
    const scan = readJson(storage, LAST_SCAN_KEY);
    if (!scan) return null;
    if (!Array.isArray(scan.users)) return null;
    if (!isFresh(scan.savedAt)) return null;
    if (!sameViewer(viewerHandle, scan.viewerHandle)) return null;
    return scan;
  }
  function saveLastScan(storage = defaultStorage(), snapshot = {}) {
    if (!storage) return false;
    const next = { ...snapshot };
    if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
    return writeJson(storage, LAST_SCAN_KEY, next);
  }

  // src/capture.js
  var captured = null;
  var FLAG = "__uxCaptureInstalled";
  function absoluteUrl(url) {
    try {
      return new URL(String(url), "https://x.com").toString();
    } catch {
      return "";
    }
  }
  function normalizeHeaders(headers) {
    const out = {};
    if (!headers) return out;
    try {
      if (typeof headers.forEach === "function" && !Array.isArray(headers)) {
        headers.forEach((value, key) => {
          out[String(key).toLowerCase()] = String(value);
        });
      } else if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
          out[String(key).toLowerCase()] = String(value);
        }
      } else {
        for (const [key, value] of Object.entries(headers)) {
          out[String(key).toLowerCase()] = String(value);
        }
      }
    } catch {
      return {};
    }
    return out;
  }
  function pickHeaders(headers) {
    const normalized = normalizeHeaders(headers);
    const out = {};
    if (normalized["x-client-transaction-id"]) {
      out["x-client-transaction-id"] = normalized["x-client-transaction-id"];
    }
    return out;
  }
  function parseBody(body) {
    if (!body) return null;
    if (typeof body === "object" && !(body instanceof URLSearchParams)) return body;
    if (typeof body !== "string") return null;
    return safeJsonParse(body, null);
  }
  function parseTemplate({ url, method = "GET", headers, body } = {}) {
    const absolute = absoluteUrl(url);
    if (!absolute) return null;
    let parsed;
    try {
      parsed = new URL(absolute);
    } catch {
      return null;
    }
    const match = parsed.pathname.match(
      /^\/i\/api\/graphql\/([^/]+)\/([^/]+)\/?$/
    );
    if (!match) return null;
    const operationName = decodeURIComponent(match[2]);
    if (operationName !== "Following" && operationName !== "followingQuery") {
      return null;
    }
    const queryId = decodeURIComponent(match[1]);
    const upperMethod = String(method || "GET").toUpperCase();
    const bodyJson = parseBody(body);
    let variables = {};
    let features = null;
    let fieldToggles = null;
    if (upperMethod === "GET") {
      variables = safeJsonParse(parsed.searchParams.get("variables"), {}) || {};
      features = safeJsonParse(parsed.searchParams.get("features"), null);
      fieldToggles = safeJsonParse(
        parsed.searchParams.get("fieldToggles"),
        null
      );
    } else {
      variables = bodyJson?.variables || {};
      features = bodyJson?.features ?? null;
      fieldToggles = bodyJson?.fieldToggles ?? null;
    }
    if (!variables || typeof variables !== "object") variables = {};
    return {
      url: absolute,
      method: upperMethod,
      headers: pickHeaders(headers),
      body: typeof body === "string" ? body : bodyJson ? JSON.stringify(bodyJson) : "",
      variables,
      features,
      fieldToggles,
      queryId,
      operationName,
      capturedAt: Date.now(),
      responseSample: null
    };
  }
  function requestParts(input, init) {
    if (input && typeof input === "object" && "url" in input) {
      return {
        url: input.url,
        method: init?.method || input.method || "GET",
        headers: init?.headers || input.headers,
        body: init?.body
      };
    }
    return {
      url: input,
      method: init?.method || "GET",
      headers: init?.headers,
      body: init?.body
    };
  }
  function attachSample(response, template) {
    if (!response || typeof response.clone !== "function") return;
    try {
      const clone = response.clone();
      if (typeof clone.json !== "function") return;
      clone.json().then((json) => {
        if (captured && captured.capturedAt === template.capturedAt) {
          captured.responseSample = json;
        }
      }).catch(() => {
      });
    } catch {
    }
  }
  function installCapture({
    fetchImpl = globalThis.fetch,
    xhrImpl = globalThis.XMLHttpRequest,
    windowImpl = globalThis.window
  } = {}) {
    const result = { fetch: null, xhr: false };
    if (typeof fetchImpl === "function" && !fetchImpl[FLAG]) {
      const wrapped = function uxCaptureFetch(input, init) {
        const parts = requestParts(input, init);
        const template = parseTemplate(parts);
        const promise = fetchImpl.apply(this, arguments);
        if (template) {
          captured = template;
          Promise.resolve(promise).then((response) => attachSample(response, template)).catch(() => {
          });
        }
        return promise;
      };
      wrapped[FLAG] = true;
      wrapped.__uxOriginalFetch = fetchImpl;
      try {
        globalThis.fetch = wrapped;
      } catch {
      }
      result.fetch = wrapped;
    }
    if (xhrImpl && xhrImpl.prototype && !xhrImpl.prototype[FLAG]) {
      const proto = xhrImpl.prototype;
      const originalOpen = proto.open;
      const originalSend = proto.send;
      proto.__uxOriginalOpen = originalOpen;
      proto.__uxOriginalSend = originalSend;
      proto.open = function uxOpen(method, url, ...rest) {
        this.__uxRequest = { method, url };
        return originalOpen.call(this, method, url, ...rest);
      };
      proto.send = function uxSend(body) {
        const meta = this.__uxRequest;
        if (meta) {
          const template = parseTemplate({
            url: meta.url,
            method: meta.method,
            headers: null,
            body
          });
          if (template) {
            captured = template;
            this.addEventListener?.("load", () => {
              try {
                const json = safeJsonParse(this.responseText, null);
                if (json && captured && captured.capturedAt === template.capturedAt) {
                  captured.responseSample = json;
                }
              } catch {
              }
            });
          }
        }
        return originalSend.call(this, body);
      };
      proto[FLAG] = true;
      result.xhr = true;
    }
    return result;
  }
  function uninstallCapture() {
    try {
      if (globalThis.fetch && globalThis.fetch[FLAG]) {
        const original = globalThis.fetch.__uxOriginalFetch;
        if (typeof original === "function") globalThis.fetch = original;
      }
    } catch {
    }
    try {
      const proto = globalThis.XMLHttpRequest?.prototype;
      if (proto && proto[FLAG]) {
        if (typeof proto.__uxOriginalOpen === "function") {
          proto.open = proto.__uxOriginalOpen;
        }
        if (typeof proto.__uxOriginalSend === "function") {
          proto.send = proto.__uxOriginalSend;
        }
        delete proto[FLAG];
        delete proto.__uxOriginalOpen;
        delete proto.__uxOriginalSend;
      }
    } catch {
    }
    captured = null;
  }
  function getCapturedFollowing() {
    return captured;
  }

  // src/api.js
  function makeError(kind, message, extra = {}) {
    const error = new Error(message || kind);
    error.kind = kind;
    Object.assign(error, extra);
    return error;
  }
  function walk(node, visit, depth = 0) {
    if (!node || typeof node !== "object" || depth > 30) return;
    visit(node);
    if (Array.isArray(node)) {
      for (const item of node) walk(item, visit, depth + 1);
      return;
    }
    for (const value of Object.values(node)) walk(value, visit, depth + 1);
  }
  function findInstructions(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 20) return null;
    if (Array.isArray(node.instructions)) return node.instructions;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = findInstructions(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const value of Object.values(node)) {
      const found = findInstructions(value, depth + 1);
      if (found) return found;
    }
    return null;
  }
  function firstNumber(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return null;
  }
  function parseFollowingPage(json) {
    const roots = [
      json?.data?.user_result_by_screen_name?.result,
      json?.data?.user?.result,
      json?.data?.user,
      json?.data
    ];
    let instructions = null;
    for (const root of roots) {
      instructions = findInstructions(root);
      if (instructions) break;
    }
    const users = [];
    let nextCursor = null;
    if (instructions) {
      walk(instructions, (node) => {
        const result = node.user_results?.result;
        if (result) {
          const user = normalizeUser(result);
          if (user) users.push(user);
        }
        if (node.content?.cursorType === "Bottom" && typeof node.content.value === "string") {
          nextCursor = node.content.value;
        }
        if (typeof node.entryId === "string" && node.entryId.includes("cursor-bottom") && typeof node.content?.value === "string") {
          nextCursor = node.content.value;
        }
      });
    }
    const deduped = dedupeUsers(users);
    const totalUser = json?.data?.user_result_by_screen_name?.result || json?.data?.user?.result || json?.data?.user;
    const total = firstNumber(
      totalUser?.legacy?.friends_count,
      totalUser?.relationship_counts?.following
    );
    return {
      users: deduped,
      nextCursor: nextCursor || null,
      total,
      sawFollowedBy: deduped.some(
        (user) => typeof user.followsViewer === "boolean"
      ),
      missingFollowedBy: deduped.some((user) => user.followsViewer === null)
    };
  }
  function authHeaders(csrf, transactionId, isJson) {
    const headers = {
      authorization: `Bearer ${BEARER}`,
      "x-csrf-token": csrf || "",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en"
    };
    if (transactionId) headers["x-client-transaction-id"] = transactionId;
    if (isJson) headers["content-type"] = "application/json";
    return headers;
  }
  function buildFollowingRequest(template, options = {}) {
    if (!template) throw makeError("format", "No request template");
    const {
      handle = "",
      userId = "",
      cursor = "",
      count = 50,
      csrf = ""
    } = options;
    const method = String(template.method || "GET").toUpperCase() === "POST" ? "POST" : "GET";
    const variables = { ...template.variables || {} };
    variables.count = Number(count) || 50;
    if (cursor) variables.cursor = cursor;
    else delete variables.cursor;
    if ("screenName" in variables && handle) variables.screenName = handle;
    if ("userId" in variables && userId) variables.userId = userId;
    if (template.operationName === "followingQuery" && !("screenName" in variables) && handle) {
      variables.screenName = handle;
    }
    if (template.operationName === "Following" && !("userId" in variables) && userId) {
      variables.userId = userId;
    }
    const transactionId = options.transactionId || template.headers?.["x-client-transaction-id"] || "";
    if (method === "GET") {
      const url = new URL(template.url, "https://x.com");
      url.searchParams.set("variables", JSON.stringify(variables));
      if (template.features && typeof template.features === "object") {
        url.searchParams.set("features", JSON.stringify(template.features));
      }
      if (template.fieldToggles && typeof template.fieldToggles === "object") {
        url.searchParams.set(
          "fieldToggles",
          JSON.stringify(template.fieldToggles)
        );
      }
      return {
        url: url.toString(),
        init: {
          method: "GET",
          headers: authHeaders(csrf, transactionId, false),
          credentials: "include"
        }
      };
    }
    const base = safeJsonParse(template.body, {}) || {};
    const body = {
      ...base,
      variables,
      queryId: base.queryId || template.queryId || ""
    };
    if (template.features && body.features === void 0) {
      body.features = template.features;
    }
    if (template.fieldToggles && body.fieldToggles === void 0) {
      body.fieldToggles = template.fieldToggles;
    }
    return {
      url: new URL(template.url, "https://x.com").toString(),
      init: {
        method: "POST",
        headers: authHeaders(csrf, transactionId, true),
        body: JSON.stringify(body),
        credentials: "include"
      }
    };
  }
  function buildDefaultTemplates({ handle = "", userId = "" } = {}) {
    const legacyVariables = {
      userId: String(userId || ""),
      count: 20,
      includePromotedContent: false
    };
    const legacyUrl = `https://x.com/i/api/graphql/${LEGACY_FOLLOWING_ID}/Following?variables=${encodeURIComponent(
      JSON.stringify(legacyVariables)
    )}&features=${encodeURIComponent(JSON.stringify(LEGACY_FOLLOWING_FEATURES))}`;
    const legacy = {
      url: legacyUrl,
      method: "GET",
      headers: {},
      body: "",
      variables: legacyVariables,
      features: LEGACY_FOLLOWING_FEATURES,
      fieldToggles: null,
      queryId: LEGACY_FOLLOWING_ID,
      operationName: "Following",
      capturedAt: 0,
      responseSample: null
    };
    const modernVariables = {
      count: 20,
      cursor: "",
      screenName: handle,
      withSafetyModeUserFields: true
    };
    const modern = {
      url: `https://x.com/i/api/graphql/${NEW_FOLLOWING_ID}/followingQuery`,
      method: "POST",
      headers: {},
      body: JSON.stringify({
        variables: modernVariables,
        queryId: NEW_FOLLOWING_ID
      }),
      variables: modernVariables,
      features: null,
      fieldToggles: null,
      queryId: NEW_FOLLOWING_ID,
      operationName: "followingQuery",
      capturedAt: 0,
      responseSample: null
    };
    return [legacy, modern];
  }
  function responseMessage(response, json) {
    return json?.errors?.[0]?.message || json?.error || json?.message || response?.statusText || `HTTP ${response?.status ?? "?"}`;
  }
  async function fetchJson(url, init, options = {}) {
    const {
      fetchImpl = globalThis.fetch,
      retries = 3,
      sleepFn = sleep,
      onWait,
      signal
    } = options;
    if (typeof fetchImpl !== "function") {
      throw makeError("network", "fetch is unavailable");
    }
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (signal?.aborted) throw makeError("aborted", "Aborted");
      let response;
      try {
        response = await fetchImpl(url, { ...init, signal });
      } catch (cause) {
        if (signal?.aborted) throw makeError("aborted", "Aborted");
        if (attempt < retries) {
          const wait = 5e3 * 2 ** attempt;
          onWait?.({ kind: "retry", wait, attempt, cause });
          await sleepFn(wait);
          continue;
        }
        throw makeError("network", cause?.message || "Network error", { cause });
      }
      let json = {};
      try {
        const text = await response.text();
        json = text ? safeJsonParse(text, {}) : {};
      } catch {
        json = {};
      }
      if (response.ok) return json;
      const decision = retryDecision(response.status, json);
      const resetAt = parseResetHeader(
        response.headers?.get?.("x-rate-limit-reset")
      );
      const headerDelay = parseRetryAfter(
        response.headers?.get?.("retry-after")
      );
      const retryAfter = (resetAt ? Math.max(0, resetAt - Date.now()) : 0) || headerDelay || decision.cooldownMs;
      const error = makeError(decision.kind, responseMessage(response, json), {
        status: response.status,
        body: json,
        retryAfter,
        resetAt: resetAt || Date.now() + retryAfter
      });
      if (decision.retry && attempt < retries) {
        const wait = 5e3 * 2 ** attempt;
        onWait?.({ kind: "retry", wait, attempt, error });
        await sleepFn(wait);
        continue;
      }
      throw error;
    }
    throw makeError("network", "Network error");
  }
  function numberSetting(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  async function scanFollowing(options = {}) {
    const {
      template,
      handle = "",
      userId = "",
      csrf = "",
      onPage = () => {
      },
      onStatus = () => {
      },
      signal,
      fetchImpl = globalThis.fetch,
      sleepFn = sleep,
      random = Math.random,
      maxPages = SCAN_LIMITS.maxPages,
      maxUsers = SCAN_LIMITS.maxUsers,
      startCursor = "",
      seedUsers = [],
      seedTotal = null,
      shouldPause,
      shouldCancel
    } = options;
    if (!template) throw makeError("format", "No request template");
    const timings = { ...DEFAULT_TIMINGS, ...options.timings || {} };
    const delayMin = numberSetting(timings.scanDelayMin, 1500);
    const delayMax = numberSetting(timings.scanDelayMax, 2500);
    const pauseEvery = numberSetting(timings.scanPauseEveryPages, 10);
    const pauseMs = numberSetting(timings.scanPauseMs, 1e4);
    let count = numberSetting(timings.usersPerRequest, 50);
    const fallbackCount = numberSetting(template.variables?.count, 20);
    let allUsers = dedupeUsers(Array.isArray(seedUsers) ? seedUsers : []);
    const seededTotal = seedTotal === null || seedTotal === void 0 ? null : Number(seedTotal);
    let total = Number.isFinite(seededTotal) ? seededTotal : null;
    let sawFollowedBy = allUsers.some(
      (user) => typeof user.followsViewer === "boolean"
    );
    let missingFollowedBy = allUsers.some(
      (user) => user.followsViewer === null || user.followsViewer === void 0
    );
    let cursor = String(startCursor || "");
    let pages = 0;
    let zeroRuns = 0;
    let stopReason = "done";
    const usedCursors = new Set(cursor ? [cursor] : []);
    const firstPage = !cursor && template.responseSample && !template.variables?.cursor ? template.responseSample : null;
    while (pages < maxPages) {
      if (signal?.aborted || shouldCancel?.()) {
        throw makeError("aborted", "Aborted");
      }
      while (shouldPause?.()) {
        if (signal?.aborted || shouldCancel?.()) {
          throw makeError("aborted", "Aborted");
        }
        onStatus({ kind: "paused", page: pages });
        await sleepFn(500);
      }
      let parsed;
      if (pages === 0 && firstPage) {
        parsed = parseFollowingPage(firstPage);
      } else {
        const request = buildFollowingRequest(template, {
          handle,
          userId,
          cursor,
          count,
          csrf
        });
        let json;
        try {
          json = await fetchJson(request.url, request.init, {
            fetchImpl,
            signal
          });
        } catch (error) {
          if (error.kind === "format" && error.status >= 400 && count !== fallbackCount) {
            count = fallbackCount;
            continue;
          }
          throw error;
        }
        parsed = parseFollowingPage(json);
        if (json?.errors?.length && parsed.users.length === 0 && !parsed.nextCursor) {
          throw makeError(
            "format",
            json.errors[0]?.message || "GraphQL error",
            { status: 200, body: json }
          );
        }
      }
      pages += 1;
      const knownIds = new Set(
        allUsers.map((user) => user.id).filter(Boolean)
      );
      const knownHandles = new Set(
        allUsers.map((user) => user.handle.toLowerCase())
      );
      const fresh = parsed.users.filter(
        (user) => !(user.id && knownIds.has(user.id)) && !knownHandles.has(user.handle.toLowerCase())
      );
      allUsers = dedupeUsers([...allUsers, ...parsed.users]);
      if (parsed.total !== null) total = parsed.total;
      sawFollowedBy = sawFollowedBy || parsed.sawFollowedBy;
      missingFollowedBy = missingFollowedBy || parsed.missingFollowedBy;
      const unverified = allUsers.length > 0 && (!sawFollowedBy || missingFollowedBy);
      onPage({
        users: parsed.users,
        fresh,
        allUsers,
        page: pages,
        total,
        nextCursor: parsed.nextCursor,
        source: "api",
        unverified
      });
      if (!parsed.nextCursor) {
        stopReason = "cursor";
        break;
      }
      if (usedCursors.has(parsed.nextCursor)) {
        stopReason = "repeated";
        break;
      }
      zeroRuns = fresh.length === 0 ? zeroRuns + 1 : 0;
      if (zeroRuns >= 2) {
        stopReason = "empty";
        break;
      }
      if (total !== null && allUsers.length >= total) {
        stopReason = "total";
        break;
      }
      if (allUsers.length >= maxUsers) {
        stopReason = "maxUsers";
        break;
      }
      if (pages >= maxPages) {
        stopReason = "maxPages";
        break;
      }
      cursor = parsed.nextCursor;
      usedCursors.add(cursor);
      const wait = delayMax <= delayMin ? delayMin : delayMin + random() * (delayMax - delayMin);
      onStatus({ kind: "delay", ms: wait, page: pages });
      await sleepFn(wait);
      if (pauseEvery > 0 && pages % pauseEvery === 0) {
        onStatus({ kind: "pause", ms: pauseMs, page: pages });
        await sleepFn(pauseMs);
      }
    }
    return {
      users: allUsers,
      total,
      pages,
      sawFollowedBy,
      missingFollowedBy,
      unverified: allUsers.length > 0 && (!sawFollowedBy || missingFollowedBy),
      stopReason
    };
  }

  // src/dom.js
  var RESERVED = /* @__PURE__ */ new Set([
    "home",
    "explore",
    "notifications",
    "messages",
    "i",
    "settings",
    "compose",
    "search",
    "bookmarks",
    "jobs",
    "communities",
    "premium",
    "verified",
    "tos",
    "privacy",
    "about",
    "login",
    "logout",
    "signup",
    "following",
    "followers",
    "lists",
    "topics",
    "grok",
    "account",
    "more",
    "intent",
    "share",
    "hashtag",
    "connect_people",
    "who_to_follow",
    "personalization",
    "your_twitter_data",
    "display",
    "language",
    "accessibility",
    "download",
    "safety",
    "help",
    "rules",
    "ads",
    "business",
    "developers",
    "directory",
    "moments",
    "spaces",
    "audio",
    "superfollows",
    "payment"
  ]);
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function pathOf(href) {
    const raw = String(href || "").trim();
    if (!raw) return "";
    try {
      if (/^https?:/i.test(raw)) return new URL(raw).pathname;
      return raw.split(/[?#]/)[0];
    } catch {
      return "";
    }
  }
  function handleFromHref(href) {
    return pathOf(href).replace(/^\/+/, "").replace(/\/+$/, "");
  }
  function isProfileHref(href) {
    const path = pathOf(href).replace(/\/+$/, "");
    const match = path.match(/^\/([A-Za-z0-9_]{1,15})$/);
    if (!match) return false;
    return !RESERVED.has(match[1].toLowerCase());
  }
  function rowContainer(link) {
    if (!link) return null;
    const known = link.closest?.(
      '[data-testid="UserCell"], [data-testid="cellInnerDiv"], [role="listitem"], li'
    );
    if (known && known.querySelector?.('button,[role="button"]')) return known;
    let node = link;
    for (let i = 0; i < 10; i += 1) {
      node = node.parentElement;
      if (!node || node === node.ownerDocument?.body) break;
      if (node.querySelector?.('button,[role="button"]') && node.querySelector?.("img")) {
        return node;
      }
    }
    return link.parentElement || null;
  }
  function cleanName(raw, handle) {
    let text = String(raw || "").replace(/\s+/g, " ").trim();
    text = text.replace(
      new RegExp(`@${escapeRegExp(handle)}\\b`, "ig"),
      " "
    );
    text = text.replace(
      /\b(follows you|following|follow|seni takip ediyor|takip ediliyor|takibi bırak|takip et)\b/gi,
      " "
    );
    return text.replace(/\s+/g, " ").trim();
  }
  function parseUserRow(row) {
    if (!row?.querySelectorAll) return null;
    const links = [...row.querySelectorAll("a[href]")].filter(
      (link) => isProfileHref(link.getAttribute("href"))
    );
    if (!links.length) return null;
    const handle = handleFromHref(links[0].getAttribute("href"));
    if (!handle) return null;
    const nameText = links.map((link) => link.textContent || "").filter((text2) => text2.trim()).join(" ");
    let name = cleanName(nameText, handle);
    if (!name) {
      const alt = [...row.querySelectorAll("img[alt]")].map((img) => img.getAttribute("alt") || "").find((text2) => text2.trim());
      if (alt) name = cleanName(alt, handle);
    }
    if (!name) name = handle;
    const avatar = row.querySelector('img[src*="profile_images"]')?.getAttribute("src") || row.querySelector("img[src]")?.getAttribute("src") || "";
    const verified = Boolean(
      row.querySelector(
        '[data-testid="icon-verified"], [data-testid="verificationBadge"], svg[data-testid*="verified"], [aria-label*="Verified" i], [aria-label*="Do\u011Frulanm\u0131\u015F" i]'
      )
    );
    const protectedUser = Boolean(
      row.querySelector(
        '[data-testid="icon-lock"], [aria-label*="Protected" i], [aria-label*="Korumal\u0131" i]'
      )
    );
    const text = String(row.textContent || "").replace(/\s+/g, " ").toLowerCase();
    const explicitFollows = Boolean(
      row.querySelector(
        '[data-testid="userFollowIndicator"], [data-testid*="follow-indicator"], [aria-label*="Follows you" i], [aria-label*="Seni takip ediyor" i]'
      )
    );
    const followsText = /\bfollows you\b/.test(text) || /seni takip ediyor/.test(text);
    const knownEnglish = /\bfollowing\b|\bfollow\b/.test(text) || String(row.ownerDocument?.documentElement?.lang || "").toLowerCase().startsWith("en");
    const knownTurkish = /takip ediliyor|takibi bırak|takip et\b/.test(text) || String(row.ownerDocument?.documentElement?.lang || "").toLowerCase().startsWith("tr");
    const followsViewer = explicitFollows || followsText ? true : knownEnglish || knownTurkish ? false : null;
    return {
      id: String(
        row.getAttribute("data-user-id") || row.querySelector("[data-user-id]")?.getAttribute("data-user-id") || ""
      ),
      handle,
      name,
      avatar,
      verified,
      protected: protectedUser,
      followsViewer
    };
  }
  function collectVisibleUsers(root = globalThis.document) {
    const users = [];
    if (!root?.querySelectorAll) return users;
    const seenRows = /* @__PURE__ */ new Set();
    for (const link of root.querySelectorAll("a[href]")) {
      if (!isProfileHref(link.getAttribute("href"))) continue;
      const row = rowContainer(link);
      if (!row || seenRows.has(row)) continue;
      if (!row.querySelector('button,[role="button"]')) continue;
      seenRows.add(row);
      const user = parseUserRow(row);
      if (user) users.push(user);
    }
    return dedupeUsers(users);
  }
  function findRowByHandle(root, handle) {
    const target = String(handle || "").replace(/^@/, "").toLowerCase();
    if (!target || !root?.querySelectorAll) return null;
    for (const link of root.querySelectorAll("a[href]")) {
      if (!isProfileHref(link.getAttribute("href"))) continue;
      if (handleFromHref(link.getAttribute("href")).toLowerCase() === target) {
        return rowContainer(link);
      }
    }
    return null;
  }
  function findUnfollowButton(row) {
    if (!row?.querySelectorAll) return null;
    const buttons = [...row.querySelectorAll('button,[role="button"]')];
    return buttons.find((element) => {
      const testId = String(
        element.getAttribute("data-testid") || ""
      ).toLowerCase();
      const label = String(element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      const aria = String(
        element.getAttribute("aria-label") || ""
      ).toLowerCase();
      if (testId.includes("unfollow")) return true;
      if (/^(following|unfollow|takip ediliyor|takibi bırak)$/.test(label)) {
        return true;
      }
      return /unfollow|takipten çık|takibi bırak/.test(aria);
    }) || null;
  }
  function findConfirmButton(root = globalThis.document) {
    if (!root?.querySelector) return null;
    const dialog = root.querySelector(
      '[role="dialog"], [data-testid="confirmationSheet"], [data-testid="confirmationSheetDialog"]'
    );
    const scope = dialog || root;
    const byTestId = scope.querySelector(
      '[data-testid="confirmationSheetConfirm"], [data-testid$="-confirm"]'
    );
    if (byTestId) return byTestId;
    return [...scope.querySelectorAll('button,[role="button"]')].find(
      (element) => /^(unfollow|takipten çık|takibi bırak|confirm|onayla)$/i.test(
        String(element.textContent || "").replace(/\s+/g, " ").trim()
      )
    ) || null;
  }
  async function clickUnfollow(row, root = globalThis.document, { sleepFn = sleep } = {}) {
    const action = findUnfollowButton(row);
    if (!action) return { ok: false, reason: "button" };
    try {
      action.click();
    } catch {
      return { ok: false, reason: "click" };
    }
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleepFn(150);
      const confirm = findConfirmButton(root);
      if (confirm) {
        try {
          confirm.click();
        } catch {
          return { ok: false, reason: "confirm-click" };
        }
        await sleepFn(1e3);
        return { ok: true, confirmed: true };
      }
      const next = findUnfollowButton(row);
      const label = String(next?.textContent || "").trim().toLowerCase();
      if (!next || /^(follow|takip et)$/.test(label)) {
        return { ok: true, confirmed: false };
      }
    }
    return { ok: false, reason: "confirm" };
  }
  async function scanDom({
    root = globalThis.document,
    onPage = () => {
    },
    signal,
    sleepFn = sleep,
    maxRounds = 8,
    scrollStep = 900,
    stepMs = 800,
    win = globalThis.window,
    maxUsers = 1e4
  } = {}) {
    let users = [];
    let rounds = 0;
    let idleRounds = 0;
    while (rounds < 200 && users.length < maxUsers) {
      if (signal?.aborted) {
        const error = new Error("Aborted");
        error.kind = "aborted";
        throw error;
      }
      const batch = collectVisibleUsers(root);
      const knownHandles = new Set(
        users.map((user) => user.handle.toLowerCase())
      );
      const knownIds = new Set(users.map((user) => user.id).filter(Boolean));
      const fresh = batch.filter(
        (user) => !knownHandles.has(user.handle.toLowerCase()) && !(user.id && knownIds.has(user.id))
      );
      users = dedupeUsers([...users, ...batch]);
      rounds += 1;
      if (fresh.length) {
        idleRounds = 0;
        onPage({
          users: fresh,
          allUsers: users,
          total: null,
          nextCursor: null,
          page: rounds,
          source: "dom",
          unverified: users.some((user) => user.followsViewer === null)
        });
      } else {
        idleRounds += 1;
      }
      if (idleRounds >= maxRounds) break;
      try {
        win?.scrollBy?.(0, scrollStep);
      } catch {
      }
      await sleepFn(stepMs);
    }
    return {
      users,
      unverified: users.some((user) => user.followsViewer === null),
      rounds
    };
  }

  // src/unfollow.js
  function originOf(ctx) {
    return ctx.origin || typeof location !== "undefined" && location.origin || "https://x.com";
  }
  function authHeaders2(ctx, contentType) {
    const headers = {
      authorization: `Bearer ${ctx.bearer || BEARER}`,
      "x-csrf-token": ctx.csrf || "",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en",
      "content-type": contentType
    };
    if (ctx.transactionId) {
      headers["x-client-transaction-id"] = ctx.transactionId;
    }
    return headers;
  }
  async function requestJson(url, init, ctx) {
    const fetchImpl = ctx.fetchImpl || globalThis.fetch;
    try {
      const response = await fetchImpl(url, {
        ...init,
        credentials: "include"
      });
      const text = await response.text();
      const json = text ? safeJsonParse(text, {}) : {};
      return { response, json };
    } catch (error) {
      return { error };
    }
  }
  function statusStop(response, json) {
    const status = Number(response.status);
    const decision = retryDecision(status, json);
    const resetAt = parseResetHeader(
      response.headers?.get?.("x-rate-limit-reset")
    );
    const headerDelay = parseRetryAfter(response.headers?.get?.("retry-after"));
    const retryAfter = (resetAt ? Math.max(0, resetAt - Date.now()) : 0) || headerDelay || decision.cooldownMs;
    if (decision.kind === "rate" || decision.kind === "auth" || decision.kind === "blocked") {
      return {
        ok: false,
        stop: decision.kind,
        status,
        retryAfter,
        resetAt: resetAt || Date.now() + retryAfter
      };
    }
    if (status >= 500) {
      return {
        ok: false,
        stop: "network",
        status,
        retryAfter: 5e3,
        resetAt: Date.now() + 5e3
      };
    }
    return null;
  }
  function evaluateMutation(json) {
    const typename = json?.data?.unfollow_user?.__typename;
    if (typename === "UnfollowSuccessResult") return { ok: true };
    return {
      ok: false,
      reason: json?.errors?.[0]?.message || typename || "mutation",
      downgrade: true
    };
  }
  function evaluateRest(status, json) {
    const code = Number(status);
    if (code >= 200 && code < 300) {
      if (json?.following === false) return { ok: true };
      if (json?.following === true) {
        return { ok: false, reason: "still-following" };
      }
      if (json?.id_str || json?.id || json?.screen_name) return { ok: true };
      return { ok: false, reason: "unknown", downgrade: true };
    }
    if (code === 400 || code === 404) {
      return { ok: false, downgrade: true, status: code };
    }
    if (code === 429) return { ok: false, stop: "rate", status: code };
    if (code === 401) return { ok: false, stop: "auth", status: code };
    if (code === 403) return { ok: false, stop: "blocked", status: code };
    if (code >= 500) return { ok: false, stop: "network", status: code };
    return { ok: false, reason: `http-${code}`, status: code };
  }
  async function unfollowViaMutation(user, ctx = {}) {
    if (!user?.id) {
      return { ok: false, downgrade: true, reason: "no-id" };
    }
    const url = new URL(UNFOLLOW_PATHS.mutation, originOf(ctx)).toString();
    const result = await requestJson(
      url,
      {
        method: "POST",
        headers: authHeaders2(ctx, "application/json"),
        body: JSON.stringify({
          variables: { targetUserId: String(user.id) },
          queryId: UNFOLLOW_MUTATION_ID
        })
      },
      ctx
    );
    if (result.error) {
      return {
        ok: false,
        stop: "network",
        reason: result.error?.message || "network"
      };
    }
    const { response, json } = result;
    if (response.status === 400 || response.status === 404) {
      return { ok: false, downgrade: true, status: response.status };
    }
    const stop = statusStop(response, json);
    if (stop) return stop;
    if (response.status >= 200 && response.status < 300) {
      return evaluateMutation(json);
    }
    return { ok: false, reason: `http-${response.status}`, status: response.status };
  }
  async function unfollowViaRest(user, ctx = {}) {
    if (!user?.id && !user?.handle) {
      return { ok: false, reason: "no-handle" };
    }
    const params = new URLSearchParams();
    if (user.id) params.set("user_id", String(user.id));
    else params.set("screen_name", String(user.handle));
    const url = new URL(UNFOLLOW_PATHS.rest, originOf(ctx)).toString();
    const result = await requestJson(
      url,
      {
        method: "POST",
        headers: authHeaders2(
          ctx,
          "application/x-www-form-urlencoded;charset=UTF-8"
        ),
        body: params.toString()
      },
      ctx
    );
    if (result.error) {
      return {
        ok: false,
        stop: "network",
        reason: result.error?.message || "network"
      };
    }
    const { response, json } = result;
    if (response.status === 400 || response.status === 404) {
      return { ok: false, downgrade: true, status: response.status };
    }
    const stop = statusStop(response, json);
    if (stop) return stop;
    return evaluateRest(response.status, json);
  }
  async function unfollowViaUi(user, ctx = {}) {
    if (typeof ctx.uiUnfollow === "function") {
      return ctx.uiUnfollow(user, ctx);
    }
    const root = ctx.root || globalThis.document;
    const row = ctx.findRow ? ctx.findRow(user) : findRowByHandle(root, user.handle);
    if (!row) return { ok: false, reason: "row" };
    return clickUnfollow(row, root, { sleepFn: ctx.sleep || sleep });
  }
  async function runUnfollowQueue({
    targets = [],
    ctx = {},
    max,
    onProgress = () => {
    },
    shouldPause,
    shouldCancel,
    transport
  } = {}) {
    const timings = { ...DEFAULT_TIMINGS, ...ctx.timings || {} };
    const limit = max === void 0 ? Number(timings.maxUnfollows) || DEFAULT_TIMINGS.maxUnfollows : Number(max);
    const queue = targets.slice(0, Math.max(0, Math.min(limit, targets.length)));
    const sleepFn = ctx.sleep || sleep;
    const random = ctx.random || Math.random;
    let currentTransport = transport || TRANSPORTS.mutation;
    let ok = 0;
    let fail = 0;
    let processed = 0;
    let stopped = null;
    let stopInfo = null;
    const results = [];
    const notify = (event) => onProgress({
      ...event,
      counts: { ok, fail },
      transport: currentTransport
    });
    for (let index = 0; index < queue.length; index += 1) {
      if (shouldCancel?.()) {
        stopped = "cancel";
        break;
      }
      while (shouldPause?.()) {
        if (shouldCancel?.()) {
          stopped = "cancel";
          break;
        }
        notify({ kind: "paused", index, total: queue.length });
        await sleepFn(250);
      }
      if (stopped) break;
      const user = queue[index];
      let outcome = null;
      for (let guard = 0; guard < 3; guard += 1) {
        if (!user?.handle && !user?.id) {
          outcome = { ok: false, reason: "no-handle" };
          break;
        }
        let result;
        if (currentTransport === TRANSPORTS.mutation) {
          if (!user.id) {
            currentTransport = TRANSPORTS.rest;
            notify({ kind: "downgrade", to: "rest", user, reason: "no-id" });
            continue;
          }
          result = await unfollowViaMutation(user, ctx);
        } else if (currentTransport === TRANSPORTS.rest) {
          result = await unfollowViaRest(user, ctx);
        } else {
          result = await unfollowViaUi(user, ctx);
        }
        if (result.ok) {
          outcome = result;
          break;
        }
        if (result.stop) {
          outcome = result;
          stopped = result.stop;
          stopInfo = result;
          break;
        }
        if (result.downgrade) {
          if (currentTransport === TRANSPORTS.mutation) {
            currentTransport = TRANSPORTS.rest;
            notify({
              kind: "downgrade",
              to: "rest",
              user,
              reason: result.reason
            });
            continue;
          }
          if (currentTransport === TRANSPORTS.rest) {
            currentTransport = TRANSPORTS.ui;
            notify({
              kind: "downgrade",
              to: "ui",
              user,
              reason: result.reason
            });
            continue;
          }
        }
        outcome = result;
        break;
      }
      processed += 1;
      if (outcome?.ok) {
        ok += 1;
        results.push({ user, ok: true, transport: currentTransport });
        notify({
          kind: "result",
          user,
          ok: true,
          index,
          total: queue.length
        });
      } else {
        fail += 1;
        results.push({
          user,
          ok: false,
          reason: outcome?.reason,
          transport: currentTransport
        });
        notify({
          kind: "result",
          user,
          ok: false,
          reason: outcome?.reason,
          index,
          total: queue.length
        });
      }
      if (stopped) break;
      if (index < queue.length - 1) {
        const wait = randomBetween(
          timings.unfollowDelayMin,
          timings.unfollowDelayMax
        );
        notify({ kind: "delay", ms: wait, index, total: queue.length });
        await sleepFn(wait);
        if (Number(timings.unfollowPauseEvery) > 0 && ok > 0 && ok % Number(timings.unfollowPauseEvery) === 0) {
          notify({
            kind: "long-pause",
            ms: timings.unfollowPauseMs,
            index,
            total: queue.length
          });
          await sleepFn(timings.unfollowPauseMs);
        }
      }
    }
    const output = {
      ok,
      fail,
      processed,
      remaining: Math.max(0, queue.length - processed),
      stopped,
      stopInfo,
      transport: currentTransport,
      results
    };
    notify({ kind: "done", ...output });
    return output;
  }

  // src/ui.js
  var LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
  var CSS = `
#${APP_ID}, #${APP_ID} * { box-sizing: border-box; }
#${APP_ID} {
  --ux-bg: #0a0e13;
  --ux-panel: rgba(15, 20, 26, 0.96);
  --ux-panel-2: rgba(23, 30, 38, 0.96);
  --ux-border: rgba(255, 255, 255, 0.10);
  --ux-border-strong: rgba(255, 255, 255, 0.18);
  --ux-text: #e7e9ea;
  --ux-muted: #8b98a5;
  --ux-faint: #61707d;
  --ux-accent: #1d9bf0;
  --ux-accent-2: #7856ff;
  --ux-ok: #00ba7c;
  --ux-danger: #f4212e;
  --ux-warn: #ffd400;
  position: fixed;
  top: 68px;
  right: 18px;
  z-index: 2147483647;
  color: var(--ux-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.35;
  color-scheme: dark;
}
#${APP_ID} button, #${APP_ID} input, #${APP_ID} select, #${APP_ID} textarea { font: inherit; color: inherit; }
#${APP_ID} button { border: 0; background: none; cursor: pointer; }
#${APP_ID} a { color: inherit; text-decoration: none; }
#${APP_ID} svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; display: block; }
#${APP_ID} .ux-panel {
  width: 424px;
  max-height: min(760px, calc(100vh - 32px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, var(--ux-panel-2), var(--ux-panel));
  border: 1px solid var(--ux-border);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(29, 155, 240, 0.06) inset;
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  animation: ux-in 180ms ease-out;
}
@keyframes ux-in { from { opacity: 0; transform: translateY(-6px) scale(.985); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px 10px 14px;
  border-bottom: 1px solid var(--ux-border);
  background: linear-gradient(180deg, rgba(29, 155, 240, 0.06), transparent);
  cursor: grab;
  user-select: none;
}
#${APP_ID} .ux-head:active { cursor: grabbing; }
#${APP_ID} .ux-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
#${APP_ID} .ux-mark {
  width: 34px; height: 34px; border-radius: 11px;
  display: grid; place-items: center;
  font-weight: 900; font-size: 17px; letter-spacing: -0.04em;
  color: #fff;
  background: linear-gradient(145deg, var(--ux-accent), var(--ux-accent-2));
  box-shadow: 0 6px 18px rgba(29, 155, 240, 0.28);
  flex: none;
}
#${APP_ID} .ux-brand-text { display: flex; flex-direction: column; min-width: 0; }
#${APP_ID} .ux-brand-text strong { font-size: 14px; letter-spacing: -0.01em; }
#${APP_ID} .ux-brand-text span { font-size: 11px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-head-actions { display: flex; align-items: center; gap: 2px; flex: none; }
#${APP_ID} .ux-icon-btn {
  width: 30px; height: 30px; border-radius: 9px;
  display: inline-grid; place-items: center;
  color: var(--ux-muted);
  transition: background 120ms ease, color 120ms ease;
}
#${APP_ID} .ux-icon-btn:hover { background: rgba(255,255,255,.08); color: var(--ux-text); }
#${APP_ID} .ux-icon-btn.is-danger:hover { color: var(--ux-danger); }
#${APP_ID} .ux-lang {
  height: 26px; min-width: 34px; padding: 0 8px;
  border-radius: 8px; border: 1px solid var(--ux-border);
  font-size: 11px; font-weight: 700; color: var(--ux-muted);
  letter-spacing: .04em;
}
#${APP_ID} .ux-lang:hover { color: var(--ux-text); border-color: var(--ux-border-strong); }
#${APP_ID} .ux-body { overflow: auto; overscroll-behavior: contain; }
#${APP_ID} .ux-body::-webkit-scrollbar { width: 10px; }
#${APP_ID} .ux-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 99px; border: 3px solid transparent; background-clip: padding-box; }
#${APP_ID} .ux-view { padding: 16px; }
#${APP_ID} .ux-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; color: var(--ux-muted); }
#${APP_ID} .ux-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 99px; background: var(--ux-accent); box-shadow: 0 0 10px var(--ux-accent); }
#${APP_ID} h1 { font-size: 22px; line-height: 1.12; letter-spacing: -0.035em; margin: 8px 0 8px; font-weight: 800; }
#${APP_ID} h2 { font-size: 18px; line-height: 1.2; letter-spacing: -0.025em; margin: 0; font-weight: 800; }
#${APP_ID} p { margin: 0; }
#${APP_ID} .ux-muted { color: var(--ux-muted); }
#${APP_ID} .ux-hero p { color: var(--ux-muted); font-size: 13px; line-height: 1.5; }
#${APP_ID} .ux-card {
  margin-top: 14px; padding: 12px;
  border: 1px solid var(--ux-border); border-radius: 16px;
  background: linear-gradient(180deg, rgba(29,155,240,.08), rgba(255,255,255,.02));
}
#${APP_ID} .ux-card-line { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; color: var(--ux-muted); }
#${APP_ID} .ux-card-line strong { color: var(--ux-text); }
#${APP_ID} .ux-live-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--ux-ok); box-shadow: 0 0 0 4px rgba(0,186,124,.12); flex: none; }
#${APP_ID} .ux-live-dot.is-paused { background: var(--ux-warn); box-shadow: 0 0 0 4px rgba(255,212,0,.12); }
#${APP_ID} .ux-btn {
  min-height: 38px; padding: 0 14px;
  border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 13px; font-weight: 700; letter-spacing: -0.01em;
  border: 1px solid transparent; transition: transform 120ms ease, background 120ms ease, border-color 120ms ease, opacity 120ms ease;
}
#${APP_ID} .ux-btn:active { transform: translateY(1px); }
#${APP_ID} .ux-btn:disabled { opacity: .42; cursor: not-allowed; }
#${APP_ID} .ux-btn-block { width: 100%; }
#${APP_ID} .ux-btn-primary { background: linear-gradient(145deg, #1d9bf0, #1478c8); color: #fff; box-shadow: 0 8px 24px rgba(29,155,240,.22); }
#${APP_ID} .ux-btn-primary:hover:not(:disabled) { background: linear-gradient(145deg, #31a8f7, #1684d8); }
#${APP_ID} .ux-btn-soft { background: rgba(255,255,255,.07); border-color: var(--ux-border); color: var(--ux-text); }
#${APP_ID} .ux-btn-soft:hover:not(:disabled) { background: rgba(255,255,255,.11); }
#${APP_ID} .ux-btn-danger { background: rgba(244,33,46,.10); border-color: rgba(244,33,46,.28); color: #ff7a82; }
#${APP_ID} .ux-btn-danger:hover:not(:disabled) { background: rgba(244,33,46,.17); }
#${APP_ID} .ux-btn-ghost { color: var(--ux-muted); }
#${APP_ID} .ux-btn-ghost:hover:not(:disabled) { color: var(--ux-text); background: rgba(255,255,255,.06); }
#${APP_ID} .ux-stack { display: grid; gap: 8px; margin-top: 12px; }
#${APP_ID} .ux-safety { display: flex; gap: 8px; align-items: flex-start; margin-top: 14px; padding: 10px 11px; border-radius: 12px; background: rgba(0,186,124,.07); border: 1px solid rgba(0,186,124,.18); color: #9ee6c8; font-size: 11px; line-height: 1.45; }
#${APP_ID} .ux-safety svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-scan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
#${APP_ID} .ux-scan-top h2 { margin-top: 6px; }
#${APP_ID} .ux-source-badge { font-size: 10px; font-weight: 800; letter-spacing: .08em; color: var(--ux-muted); border: 1px solid var(--ux-border); border-radius: 8px; padding: 4px 7px; }
#${APP_ID} .ux-bar { height: 6px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
#${APP_ID} .ux-bar i { display: block; height: 100%; width: 0%; border-radius: inherit; background: linear-gradient(90deg, var(--ux-accent), var(--ux-accent-2)); transition: width 300ms ease; }
#${APP_ID} .ux-bar.is-indeterminate i { width: 38% !important; animation: ux-indeterminate 1.15s ease-in-out infinite; }
@keyframes ux-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(280%); } }
#${APP_ID} .ux-scan-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; font-size: 11px; color: var(--ux-muted); }
#${APP_ID} .ux-hint { margin-top: 12px; font-size: 11.5px; line-height: 1.5; color: var(--ux-muted); }
#${APP_ID} .ux-live-list { display: grid; gap: 6px; margin-top: 12px; }
#${APP_ID} .ux-mini-row { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 11px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.05); }
#${APP_ID} .ux-mini-row .ux-avatar { width: 30px; height: 30px; font-size: 12px; }
#${APP_ID} .ux-mini-user { min-width: 0; display: flex; flex-direction: column; }
#${APP_ID} .ux-mini-user strong { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-mini-user span { font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-actions { display: flex; gap: 8px; margin-top: 14px; }
#${APP_ID} .ux-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
#${APP_ID} .ux-results-head h2 { font-size: 19px; }
#${APP_ID} .ux-results-head p { margin-top: 4px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-results-links { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex: none; }
#${APP_ID} .ux-link { color: var(--ux-accent); font-size: 11.5px; font-weight: 700; padding: 4px 0; white-space: nowrap; }
#${APP_ID} .ux-link:hover { text-decoration: underline; }
#${APP_ID} .ux-warning { display: flex; gap: 8px; align-items: flex-start; margin-top: 12px; padding: 9px 10px; border-radius: 11px; color: #ffd9a3; background: rgba(255,158,11,.08); border: 1px solid rgba(255,158,11,.2); font-size: 11.5px; line-height: 1.45; }
#${APP_ID} .ux-warning svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-search { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 0 10px; height: 38px; border: 1px solid var(--ux-border); border-radius: 11px; background: rgba(255,255,255,.04); }
#${APP_ID} .ux-search svg { width: 16px; height: 16px; color: var(--ux-muted); flex: none; }
#${APP_ID} .ux-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 12.5px; }
#${APP_ID} .ux-search input::placeholder { color: var(--ux-faint); }
#${APP_ID} .ux-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
#${APP_ID} .ux-chip {
  height: 27px; padding: 0 9px; border-radius: 99px;
  border: 1px solid var(--ux-border); color: var(--ux-muted);
  font-size: 10.5px; font-weight: 700; letter-spacing: .01em;
  display: inline-flex; align-items: center; gap: 5px;
  transition: all 120ms ease;
}
#${APP_ID} .ux-chip:hover { border-color: var(--ux-border-strong); color: var(--ux-text); }
#${APP_ID} .ux-chip.is-on { background: rgba(29,155,240,.14); border-color: rgba(29,155,240,.4); color: #8fd3ff; }
#${APP_ID} .ux-chip .ux-chip-count { font-size: 9.5px; opacity: .75; }
#${APP_ID} .ux-list { display: grid; gap: 5px; margin-top: 10px; }
#${APP_ID} .ux-row {
  display: grid; grid-template-columns: 18px 38px minmax(0, 1fr) auto;
  align-items: center; gap: 9px;
  padding: 8px 7px; border-radius: 12px;
  border: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
}
#${APP_ID} .ux-row:hover { background: rgba(255,255,255,.045); border-color: rgba(255,255,255,.06); }
#${APP_ID} .ux-row.is-hidden { opacity: .55; }
#${APP_ID} .ux-row input[type="checkbox"], #${APP_ID} .ux-check input[type="checkbox"] { width: 15px; height: 15px; accent-color: var(--ux-accent); cursor: pointer; }
#${APP_ID} .ux-check { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; color: var(--ux-muted); cursor: pointer; }
#${APP_ID} .ux-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; display: grid; place-items: center; flex: none; background: rgba(255,255,255,.08); }
#${APP_ID} .ux-avatar-fallback { font-size: 14px; font-weight: 800; color: #dcefff; background: linear-gradient(145deg, rgba(29,155,240,.7), rgba(120,86,255,.7)); }
#${APP_ID} .ux-user { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-user a { min-width: 0; }
#${APP_ID} .ux-user strong { display: block; font-size: 12.5px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-user span { display: block; font-size: 11px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-badges { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
#${APP_ID} .ux-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 700; border-radius: 5px; padding: 1px 4px; color: var(--ux-muted); background: rgba(255,255,255,.06); }
#${APP_ID} .ux-badge svg { width: 11px; height: 11px; }
#${APP_ID} .ux-badge-blue { color: #8fd3ff; background: rgba(29,155,240,.14); }
#${APP_ID} .ux-badge-warn { color: #ffd98a; background: rgba(255,212,0,.10); }
#${APP_ID} .ux-badge-muted { color: var(--ux-faint); }
#${APP_ID} .ux-row-actions { display: flex; align-items: center; gap: 1px; opacity: .55; transition: opacity 120ms ease; }
#${APP_ID} .ux-row:hover .ux-row-actions { opacity: 1; }
#${APP_ID} .ux-row-actions .ux-icon-btn { width: 27px; height: 27px; }
#${APP_ID} .ux-row-actions svg { width: 15px; height: 15px; }
#${APP_ID} .ux-empty { padding: 26px 14px; text-align: center; color: var(--ux-muted); font-size: 12px; line-height: 1.5; }
#${APP_ID} .ux-empty strong { display: block; color: var(--ux-text); font-size: 13px; margin-bottom: 4px; }
#${APP_ID} .ux-actionbar {
  position: sticky; bottom: 0; z-index: 2;
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin: 10px -16px -16px; padding: 10px 12px 12px;
  border-top: 1px solid var(--ux-border);
  background: linear-gradient(180deg, rgba(15,20,26,.82), rgba(15,20,26,.98));
  backdrop-filter: blur(14px);
}
#${APP_ID} .ux-actionbar .ux-spacer { flex: 1; }
#${APP_ID} .ux-actionbar .ux-btn { min-height: 34px; padding: 0 11px; font-size: 11.5px; }
#${APP_ID} .ux-actionbar .ux-link { padding: 0 2px; }
#${APP_ID} .ux-statline { display: flex; gap: 14px; margin: 12px 0 2px; }
#${APP_ID} .ux-stat { display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-stat strong { font-size: 20px; letter-spacing: -0.03em; }
#${APP_ID} .ux-stat span { font-size: 10px; color: var(--ux-muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
#${APP_ID} .ux-current { margin-top: 12px; font-size: 13px; font-weight: 700; }
#${APP_ID} .ux-current span { color: var(--ux-accent); }
#${APP_ID} .ux-next { margin-top: 3px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-log { display: grid; gap: 5px; margin-top: 12px; max-height: 160px; overflow: auto; }
#${APP_ID} .ux-log-row { display: flex; align-items: center; gap: 7px; font-size: 11px; padding: 6px 8px; border-radius: 9px; background: rgba(255,255,255,.035); }
#${APP_ID} .ux-log-row .ux-dot { width: 6px; height: 6px; border-radius: 99px; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-log-row.is-fail .ux-dot { background: var(--ux-danger); }
#${APP_ID} .ux-log-row span:last-child { margin-left: auto; color: var(--ux-muted); }
#${APP_ID} .ux-done { text-align: center; padding: 28px 18px; }
#${APP_ID} .ux-done-icon { width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 12px; display: grid; place-items: center; color: var(--ux-ok); background: rgba(0,186,124,.12); border: 1px solid rgba(0,186,124,.24); }
#${APP_ID} .ux-done-icon svg { width: 26px; height: 26px; }
#${APP_ID} .ux-done p { color: var(--ux-muted); font-size: 12.5px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-done .ux-actions { margin-top: 18px; }
#${APP_ID} .ux-error { text-align: center; padding: 24px 16px; }
#${APP_ID} .ux-error-icon { width: 46px; height: 46px; border-radius: 50%; margin: 0 auto 10px; display: grid; place-items: center; color: #ffd9a3; background: rgba(255,158,11,.10); border: 1px solid rgba(255,158,11,.22); }
#${APP_ID} .ux-error p { color: var(--ux-muted); font-size: 12px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 14px 8px; border-top: 1px solid rgba(255,255,255,.06); font-size: 9.5px; color: var(--ux-faint); letter-spacing: .03em; }
#${APP_ID} .ux-foot .ux-foot-dot { width: 5px; height: 5px; border-radius: 99px; background: var(--ux-ok); display: inline-block; margin-right: 4px; }
#${APP_ID} .ux-pill {
  display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 12px; border-radius: 99px;
  background: linear-gradient(145deg, rgba(23,30,38,.98), rgba(15,20,26,.98));
  border: 1px solid var(--ux-border-strong);
  box-shadow: 0 12px 34px rgba(0,0,0,.45);
  font-size: 12px; font-weight: 700; color: var(--ux-text);
  backdrop-filter: blur(14px);
  animation: ux-in 160ms ease-out;
}
#${APP_ID} .ux-pill:hover { border-color: rgba(29,155,240,.55); }
#${APP_ID} .ux-pill-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--ux-accent); box-shadow: 0 0 0 4px rgba(29,155,240,.14); }
#${APP_ID} .ux-pill-dot.scanning { background: var(--ux-ok); box-shadow: 0 0 0 4px rgba(0,186,124,.14); animation: ux-pulse 1.2s infinite; }
#${APP_ID} .ux-pill-dot.unfollowing { background: var(--ux-warn); box-shadow: 0 0 0 4px rgba(255,212,0,.14); animation: ux-pulse 1.2s infinite; }
#${APP_ID} .ux-pill svg { width: 14px; height: 14px; color: var(--ux-muted); }
@keyframes ux-pulse { 50% { opacity: .45; } }
#${APP_ID} .ux-overlay {
  position: fixed; inset: 0; z-index: 2147483647;
  display: grid; place-items: center; padding: 20px;
  background: rgba(0,0,0,.62);
  backdrop-filter: blur(3px);
  animation: ux-fade 120ms ease-out;
}
@keyframes ux-fade { from { opacity: 0; } to { opacity: 1; } }
#${APP_ID} .ux-dialog {
  width: min(380px, 100%);
  max-height: calc(100vh - 40px); overflow: auto;
  background: linear-gradient(180deg, #171e26, #0f141a);
  border: 1px solid var(--ux-border-strong);
  border-radius: 18px; padding: 18px;
  box-shadow: 0 30px 90px rgba(0,0,0,.6);
  animation: ux-dialog-in 160ms ease-out;
}
@keyframes ux-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-dialog h3 { margin: 0; font-size: 17px; letter-spacing: -0.02em; }
#${APP_ID} .ux-dialog > p { margin-top: 6px; color: var(--ux-muted); font-size: 12px; line-height: 1.55; }
#${APP_ID} .ux-dialog-content { margin-top: 12px; }
#${APP_ID} .ux-dialog-actions { display: flex; gap: 8px; margin-top: 16px; }
#${APP_ID} .ux-dialog-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-settings { display: grid; gap: 12px; }
#${APP_ID} .ux-settings-group { display: grid; gap: 7px; }
#${APP_ID} .ux-settings-title { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ux-muted); margin-bottom: 2px; }
#${APP_ID} .ux-field { display: grid; grid-template-columns: 1fr 84px; align-items: center; gap: 10px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-field input { height: 32px; width: 100%; border-radius: 8px; border: 1px solid var(--ux-border); background: rgba(255,255,255,.04); padding: 0 8px; font-size: 12px; outline: 0; }
#${APP_ID} .ux-field input:focus { border-color: rgba(29,155,240,.6); box-shadow: 0 0 0 3px rgba(29,155,240,.12); }
#${APP_ID} .ux-input { width: 100%; height: 36px; border-radius: 9px; border: 1px solid var(--ux-border); background: rgba(255,255,255,.04); padding: 0 10px; outline: 0; }
#${APP_ID} .ux-input:focus { border-color: rgba(29,155,240,.6); }
#${APP_ID} .ux-toast {
  position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
  z-index: 2147483647; max-width: min(420px, calc(100vw - 28px));
  padding: 10px 14px; border-radius: 11px;
  background: rgba(23,30,38,.98); border: 1px solid var(--ux-border-strong);
  box-shadow: 0 14px 40px rgba(0,0,0,.45);
  font-size: 12px; color: var(--ux-text);
  animation: ux-toast-in 160ms ease-out;
}
@keyframes ux-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
#${APP_ID} :focus-visible { outline: 2px solid var(--ux-accent); outline-offset: 2px; }
@media (max-width: 560px) {
  #${APP_ID} { top: 12px; left: 12px; right: 12px; }
  #${APP_ID} .ux-panel { width: auto; max-height: calc(100vh - 24px); }
  #${APP_ID} .ux-row { grid-template-columns: 18px 34px minmax(0, 1fr) auto; }
  #${APP_ID} .ux-avatar { width: 34px; height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  #${APP_ID} *, #${APP_ID} *::before, #${APP_ID} *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;
  function setOf(value) {
    if (value instanceof Set) return value;
    if (Array.isArray(value)) return new Set(value);
    return /* @__PURE__ */ new Set();
  }
  function keyOf(user) {
    return String(user?.id || String(user?.handle || "").toLowerCase());
  }
  function hiddenKeys(user) {
    return [
      keyOf(user),
      String(user?.id || ""),
      String(user?.handle || "").toLowerCase()
    ].filter(Boolean);
  }
  function isHidden(user, hidden) {
    return hiddenKeys(user).some((key) => hidden.has(key));
  }
  function getDisplayUsers(state) {
    const filters = { ...DEFAULT_FILTERS, ...state.filters || {} };
    const hidden = setOf(state.hidden);
    const search = String(state.search || "").trim().toLowerCase().replace(/^@/, "");
    return (state.users || []).filter((user) => user && user.handle).filter((user) => user.followsViewer !== true).filter((user) => filters.showHidden || !isHidden(user, hidden)).filter((user) => filters.verified || !user.verified).filter((user) => filters.protected || !user.protected).filter((user) => filters.noAvatar || !isDefaultAvatar(user)).filter((user) => {
      if (!search) return true;
      return user.handle.toLowerCase().includes(search) || String(user.name || "").toLowerCase().includes(search);
    }).sort((a, b) => a.handle.localeCompare(b.handle));
  }
  function pruneSelection(state) {
    const visible = new Set(getDisplayUsers(state).map(keyOf));
    const selected = setOf(state.selected);
    for (const key of [...selected]) {
      if (!visible.has(key)) selected.delete(key);
    }
    state.selected = selected;
    return selected;
  }
  function selectedUsers(state) {
    const selected = setOf(state.selected);
    return (state.users || []).filter(
      (user) => user && user.handle && selected.has(keyOf(user))
    );
  }
  function visibleSelectedCount(state) {
    const selected = setOf(state.selected);
    return getDisplayUsers(state).filter((user) => selected.has(keyOf(user))).length;
  }
  function countLabel(state, t) {
    const count = getDisplayUsers(state).length;
    if (count === 0) return t("foundNone");
    if (count === 1) return t("foundOne");
    return t("foundCount", { count });
  }
  function profileUrl(handle) {
    return `https://x.com/${encodeURIComponent(handle)}`;
  }
  function avatarHTML(user) {
    const src = /^https?:\/\//i.test(String(user.avatar || "")) ? user.avatar : "";
    if (src && !isDefaultAvatar(user)) {
      return `<img class="ux-avatar" src="${escapeAttr(src)}" alt="" loading="lazy">`;
    }
    const initial = String(user.name || user.handle || "?").trim().charAt(0).toUpperCase();
    return `<span class="ux-avatar ux-avatar-fallback" aria-hidden="true">${escapeHTML(
      initial || "?"
    )}</span>`;
  }
  function badgesHTML(user, t) {
    const badges = [];
    if (user.verified) {
      badges.push(
        `<span class="ux-badge ux-badge-blue" title="${escapeAttr(
          t("filterVerified")
        )}">${ICONS.check}</span>`
      );
    }
    if (user.protected) {
      badges.push(
        `<span class="ux-badge" title="${escapeAttr(
          t("protectedBadge")
        )}">${LOCK}</span>`
      );
    }
    if (user.followsViewer === true) {
      badges.push(
        `<span class="ux-badge ux-badge-warn">${escapeHTML(
          t("followsYou")
        )}</span>`
      );
    }
    if (user.followsViewer === null || user.followsViewer === void 0) {
      badges.push(
        `<span class="ux-badge ux-badge-muted">${escapeHTML(
          t("unknown")
        )}</span>`
      );
    }
    return badges.length ? `<span class="ux-badges">${badges.join("")}</span>` : "";
  }
  function renderRow(user, state) {
    const t = makeT(state.language);
    const key = keyOf(user);
    const selected = setOf(state.selected).has(key);
    const hidden = isHidden(user, setOf(state.hidden));
    return `<div class="ux-row${hidden ? " is-hidden" : ""}" data-row="${escapeAttr(
      key
    )}">
    <input type="checkbox" data-select="${escapeAttr(key)}" ${selected ? "checked" : ""} aria-label="${escapeAttr(user.handle)}">
    <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener" aria-label="${escapeAttr(
      t("openOnX")
    )}">${avatarHTML(user)}</a>
    <div class="ux-user">
      <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener"><strong>${escapeHTML(
      user.name || user.handle
    )}</strong></a>
      <span>@${escapeHTML(user.handle)} ${badgesHTML(user, t)}</span>
    </div>
    <div class="ux-row-actions">
      <button class="ux-icon-btn" data-copy="${escapeAttr(
      user.handle
    )}" title="${escapeAttr(
      t("copyHandle", { handle: user.handle })
    )}" aria-label="${escapeAttr(
      t("copyHandle", { handle: user.handle })
    )}">${ICONS.copy}</button>
      <button class="ux-icon-btn" data-hide="${escapeAttr(key)}" title="${escapeAttr(
      hidden ? t("unhideUser", { handle: user.handle }) : t("hideUser", { handle: user.handle })
    )}" aria-label="${escapeAttr(
      hidden ? t("unhideUser", { handle: user.handle }) : t("hideUser", { handle: user.handle })
    )}">${hidden ? ICONS.eye : ICONS.eyeOff}</button>
      <a class="ux-icon-btn" href="${escapeAttr(
      profileUrl(user.handle)
    )}" target="_blank" rel="noreferrer noopener" title="${escapeAttr(
      t("openOnX")
    )}" aria-label="${escapeAttr(t("openOnX"))}">${ICONS.external}</a>
    </div>
  </div>`;
  }
  function renderMiniRow(user, state) {
    return `<div class="ux-mini-row">${avatarHTML(user)}<div class="ux-mini-user"><strong>${escapeHTML(
      user.name || user.handle
    )}</strong><span>@${escapeHTML(user.handle)}</span></div></div>`;
  }
  function renderEmpty(state, t) {
    const hasUsers = (state.users || []).some(
      (user) => user && user.followsViewer !== true
    );
    if (!hasUsers) {
      return `<div class="ux-empty"><strong>${escapeHTML(
        t("foundNone")
      )}</strong>${escapeHTML(t("rescan"))}</div>`;
    }
    return `<div class="ux-empty"><strong>${escapeHTML(
      t("noMatches")
    )}</strong>${escapeHTML(t("selectHint"))}</div>`;
  }
  function chip(label, key, on, extra = "") {
    return `<button class="ux-chip${on ? " is-on" : ""}" data-filter="${key}">${escapeHTML(
      label
    )}${extra}</button>`;
  }
  function renderResultsView(state) {
    const t = makeT(state.language);
    const users = getDisplayUsers(state);
    const selected = setOf(state.selected);
    const hidden = setOf(state.hidden);
    const selectedCount = visibleSelectedCount(state);
    const allSelected = users.length > 0 && users.every((u) => selected.has(keyOf(u)));
    const someSelected = users.some((u) => selected.has(keyOf(u)));
    const filters = { ...DEFAULT_FILTERS, ...state.filters || {} };
    const warnings = [];
    if (state.unverified) {
      warnings.push(
        `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          t("unverified")
        )}</span></div>`
      );
    }
    if (state.partial) {
      warnings.push(
        `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          t("partialBody", { count: state.scan?.scanned || users.length })
        )}</span></div>`
      );
    }
    if (state.error) {
      warnings.push(
        `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          state.error
        )}</span></div>`
      );
    }
    return `<section class="ux-view ux-results" data-view="results">
    <div class="ux-results-head">
      <div>
        <h2 data-result-count>${escapeHTML(countLabel(state, t))}</h2>
        <p>${escapeHTML(t("reviewHint"))}</p>
      </div>
      <div class="ux-results-links">
        ${state.partial && state.checkpoint ? `<button class="ux-link" data-action="resume">${escapeHTML(
      t("resumeAfter")
    )}</button>` : ""}
        <button class="ux-link" data-action="rescan">${escapeHTML(
      t("rescan")
    )}</button>
      </div>
    </div>
    ${warnings.join("")}
    <label class="ux-search">${ICONS.search}<input data-search value="${escapeAttr(
      state.search || ""
    )}" placeholder="${escapeAttr(t("search"))}" autocomplete="off" spellcheck="false"></label>
    <div class="ux-chips">
      ${chip(t("filterVerified"), "verified", filters.verified)}
      ${chip(t("filterProtected"), "protected", filters.protected)}
      ${chip(t("filterNoAvatar"), "noAvatar", filters.noAvatar)}
      ${chip(
      filters.showHidden && hidden.size ? t("showHiddenCount", { count: hidden.size }) : t("filterShowHidden"),
      "showHidden",
      filters.showHidden,
      hidden.size ? `<span class="ux-chip-count">${hidden.size}</span>` : ""
    )}
    </div>
    <div class="ux-list" data-list>${users.length ? users.map((user) => renderRow(user, state)).join("") : renderEmpty(state, t)}</div>
    <div class="ux-actionbar" data-actionbar>
      <label class="ux-check"><input type="checkbox" data-select-all ${allSelected ? "checked" : ""} data-indeterminate="${someSelected && !allSelected ? "1" : "0"}">${escapeHTML(
      t("selectAll")
    )}</label>
      <button class="ux-link" data-action="select-none">${escapeHTML(
      t("selectNone")
    )}</button>
      <span class="ux-spacer"></span>
      <button class="ux-btn ux-btn-ghost" data-action="copy-all">${escapeHTML(
      t("copyAll")
    )}</button>
      <button class="ux-btn ux-btn-primary" data-action="unfollow" ${selectedCount === 0 || state.unverified ? "disabled" : ""} data-unfollow-label>${escapeHTML(
      t("unfollow")
    )}${selectedCount ? ` (${selectedCount})` : ""}</button>
    </div>
    <p class="ux-hint" data-selected-count>${escapeHTML(
      t("selectedCount", { count: selectedCount })
    )}</p>
  </section>`;
  }
  function renderIdleView(state) {
    const t = makeT(state.language);
    const handle = state.viewer?.handle || "";
    const checkpoint = state.checkpoint;
    const lastScan = state.lastScan;
    return `<section class="ux-view ux-idle" data-view="idle">
    <div class="ux-hero">
      <span class="ux-eyebrow">${escapeHTML(t("tabFollowing"))}</span>
      <h1>${escapeHTML(t("heroTitle"))}</h1>
      <p>${escapeHTML(t("heroBody"))}</p>
    </div>
    <div class="ux-card">
      <div class="ux-card-line">
        <span class="ux-live-dot"></span>
        <strong>@${escapeHTML(handle || "\u2014")}</strong>
        <span class="ux-muted">${escapeHTML(t("navigateHint"))}</span>
      </div>
      <button class="ux-btn ux-btn-primary ux-btn-block" data-action="scan">${ICONS.search}${escapeHTML(
      t("scanBtn")
    )}</button>
    </div>
    <div class="ux-stack">
      ${checkpoint ? `<button class="ux-btn ux-btn-soft" data-action="resume">${escapeHTML(
      t("resumeAfter")
    )} <span class="ux-muted">\xB7 ${checkpoint.users?.length || 0}</span></button>` : ""}
      ${lastScan ? `<button class="ux-btn ux-btn-ghost" data-action="show-last">${escapeHTML(
      t("showLastScan")
    )} \xB7 ${escapeHTML(timeAgo(lastScan.savedAt, state.language))}</button>` : ""}
      ${!handle ? `<button class="ux-btn ux-btn-soft" data-action="manual-handle">${escapeHTML(
      t("manualHandle")
    )}</button>` : ""}
    </div>
    <div class="ux-safety">${ICONS.check}<span>${escapeHTML(
      t("safetyNote")
    )}</span></div>
  </section>`;
  }
  function renderScanView(state) {
    const t = makeT(state.language);
    const scan = state.scan || {};
    const scanned = Number(scan.scanned) || (state.users || []).length;
    const total = Number(scan.total) || 0;
    const percent = total ? clamp(scanned / total * 100, 0, 100) : 0;
    const paused = Boolean(state.paused);
    const users = getDisplayUsers(state).slice(0, 6);
    return `<section class="ux-view ux-scanning" data-view="scanning">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow">${escapeHTML(
      paused ? t("paused") : t("scanning")
    )}</span>
        <h2 data-live-count>${escapeHTML(countLabel(state, t))}</h2>
      </div>
      <span class="ux-source-badge">${escapeHTML(
      scan.source === "dom" ? t("domBadge") : t("apiBadge")
    )}</span>
    </div>
    <div class="ux-bar${total ? "" : " is-indeterminate"}"><i data-progress-bar style="width:${percent}%"></i></div>
    <div class="ux-scan-meta">
      <span>${escapeHTML(
      total ? t("ofTotal", { count: scanned, total }) : t("ofUnknown", { count: scanned })
    )}</span>
      <span data-scan-page>${escapeHTML(
      t("scanningPage", { page: scan.page || 1, count: scanned })
    )}</span>
    </div>
    <p class="ux-hint" data-scan-hint>${escapeHTML(
      scan.waiting ? t("captureWait") : paused ? t("pausedHint") : countdownText(state) || t("liveHint")
    )}</p>
    <div class="ux-live-list" data-live-list>${users.length ? users.map((user) => renderMiniRow(user, state)).join("") : `<div class="ux-empty">${escapeHTML(t("liveEmpty"))}</div>`}</div>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-action="${paused ? "resume-scan" : "pause-scan"}">${escapeHTML(paused ? t("resume") : t("pause"))}</button>
      <button class="ux-btn ux-btn-danger" data-action="cancel-scan">${escapeHTML(
      t("cancel")
    )}</button>
    </div>
  </section>`;
  }
  function renderUnfollowView(state) {
    const t = makeT(state.language);
    const run = state.unfollow || {};
    const total = Number(run.total) || 0;
    const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
    const percent = total ? clamp(done / total * 100, 0, 100) : 0;
    const paused = Boolean(state.paused);
    const log = (run.log || []).slice(-5).reverse();
    return `<section class="ux-view ux-unfollowing" data-view="unfollowing">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow">${escapeHTML(
      paused ? t("paused") : t("unfollowing")
    )}</span>
        <h2>${escapeHTML(String(done))} / ${escapeHTML(String(total))}</h2>
      </div>
      <span class="ux-source-badge">${escapeHTML(
      String(run.transport || "mutation").toUpperCase()
    )}</span>
    </div>
    <div class="ux-bar"><i data-unfollow-progress style="width:${percent}%"></i></div>
    <div class="ux-current">${escapeHTML(
      t("currently", { handle: run.current || "\u2014" })
    )}</div>
    <div class="ux-next" data-next>${escapeHTML(countdownText(state))}</div>
    <div class="ux-statline">
      <div class="ux-stat"><strong>${Number(run.ok) || 0}</strong><span>ok</span></div>
      <div class="ux-stat"><strong>${Number(run.fail) || 0}</strong><span>fail</span></div>
      <div class="ux-stat"><strong>${Math.max(0, total - done)}</strong><span>left</span></div>
    </div>
    <div class="ux-log" data-unfollow-log>${log.length ? log.map(
      (entry) => `<div class="ux-log-row${entry.ok ? "" : " is-fail"}"><span class="ux-dot"></span><span>@${escapeHTML(
        entry.handle || "\u2014"
      )}</span><span>${escapeHTML(
        entry.ok ? "ok" : entry.reason || "fail"
      )}</span></div>`
    ).join("") : `<div class="ux-empty">${escapeHTML(t("unfollowHint"))}</div>`}</div>
    <p class="ux-hint">${escapeHTML(
      paused ? t("unfollowPausedHint") : t("unfollowHint")
    )}</p>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-action="${paused ? "resume-unfollow" : "pause-unfollow"}">${escapeHTML(paused ? t("resume") : t("pause"))}</button>
      <button class="ux-btn ux-btn-danger" data-action="cancel-unfollow">${escapeHTML(
      t("cancel")
    )}</button>
    </div>
  </section>`;
  }
  function renderDoneView(state) {
    const t = makeT(state.language);
    const run = state.unfollow || {};
    const cooldown = countdownText(state);
    return `<section class="ux-view ux-done" data-view="done">
    <div class="ux-done-icon">${ICONS.check}</div>
    <h2>${escapeHTML(t("unfollowDoneTitle"))}</h2>
    <p>${escapeHTML(
      t("unfollowDoneBody", {
        ok: Number(run.ok) || 0,
        fail: Number(run.fail) || 0,
        remaining: Number(run.remaining) || 0
      })
    )}</p>
    ${cooldown ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(cooldown)}</span></div>` : ""}
    <div class="ux-actions">
      <button class="ux-btn ux-btn-primary" data-action="rescan">${escapeHTML(
      t("rescan")
    )}</button>
      <button class="ux-btn ux-btn-soft" data-action="close">${escapeHTML(
      t("close")
    )}</button>
    </div>
  </section>`;
  }
  function renderErrorView(state) {
    const t = makeT(state.language);
    const cooldown = countdownText(state);
    return `<section class="ux-view ux-error" data-view="error">
    <div class="ux-error-icon">${ICONS.alert}</div>
    <h2>${escapeHTML(t("scanFailed"))}</h2>
    <p>${escapeHTML(state.error || t("unknownError"))}</p>
    ${cooldown ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(cooldown)}</span></div>` : ""}
    <div class="ux-actions">
      <button class="ux-btn ux-btn-primary" data-action="retry-scan">${escapeHTML(
      t("retry")
    )}</button>
      <button class="ux-btn ux-btn-soft" data-action="back">${escapeHTML(
      t("goBack")
    )}</button>
    </div>
  </section>`;
  }
  function renderMode(state) {
    if (state.mode === "scanning") return renderScanView(state);
    if (state.mode === "results") return renderResultsView(state);
    if (state.mode === "unfollowing") return renderUnfollowView(state);
    if (state.mode === "done") return renderDoneView(state);
    if (state.mode === "error") return renderErrorView(state);
    return renderIdleView(state);
  }
  function renderShell(state) {
    const t = makeT(state.language);
    const handle = state.viewer?.handle || "";
    return `<div class="ux-panel" data-panel>
    <header class="ux-head" data-drag>
      <div class="ux-brand">
        <span class="ux-mark">X</span>
        <div class="ux-brand-text">
          <strong>${escapeHTML(t("appTitle"))}</strong>
          <span>${escapeHTML(handle ? `@${handle}` : t("subtitle"))}</span>
        </div>
      </div>
      <div class="ux-head-actions">
        <button class="ux-lang" data-action="toggle-language" title="${escapeAttr(
      t("langSwitch")
    )}">${escapeHTML(t("langCode"))}</button>
        <button class="ux-icon-btn" data-action="settings" title="${escapeAttr(
      t("settings")
    )}" aria-label="${escapeAttr(t("settings"))}">${ICONS.gear}</button>
        <button class="ux-icon-btn" data-action="minimize" title="${escapeAttr(
      t("minimize")
    )}" aria-label="${escapeAttr(t("minimize"))}">${ICONS.minimize}</button>
        <button class="ux-icon-btn is-danger" data-action="close" title="${escapeAttr(
      t("close")
    )}" aria-label="${escapeAttr(t("close"))}">${ICONS.close}</button>
      </div>
    </header>
    <div class="ux-body">${renderMode(state)}</div>
    <footer class="ux-foot">
      <span><span class="ux-foot-dot"></span>${escapeHTML(t("appTitle"))} v${escapeHTML(
      VERSION
    )}</span>
      <span>${escapeHTML(state.source === "dom" ? t("domBadge") : t("apiBadge"))}</span>
    </footer>
  </div>`;
  }
  function pillLabel(state) {
    const t = makeT(state.language);
    if (state.mode === "scanning") {
      return `${t("pillScanning")} \xB7 ${Number(state.scan?.scanned) || (state.users || []).length}`;
    }
    if (state.mode === "unfollowing") {
      return `${t("pillUnfollowing")} \xB7 ${Number(state.unfollow?.ok) || 0}/${Number(
        state.unfollow?.total
      ) || 0}`;
    }
    if (state.mode === "results" || state.mode === "done") {
      return t("pillResults", { count: getDisplayUsers(state).length });
    }
    return t("pillIdle");
  }
  function renderPill(state) {
    return `<button class="ux-pill" data-action="expand" title="${escapeAttr(
      makeT(state.language)("expand")
    )}">
    <span class="ux-pill-dot ${escapeAttr(state.mode || "idle")}"></span>
    <span>${escapeHTML(pillLabel(state))}</span>
    ${ICONS.expand}
  </button>`;
  }
  function countdownText(state) {
    const t = makeT(state.language);
    const now = Date.now();
    if (Number(state.cooldownUntil) > now) {
      return t("cooldownIn", { time: formatClock(state.cooldownUntil) });
    }
    if (Number(state.scanPauseUntil) > now) {
      return t("scanPause", {
        seconds: Math.ceil((Number(state.scanPauseUntil) - now) / 1e3)
      });
    }
    if (Number(state.unfollow?.nextAt) > now) {
      return t("nextActionIn", {
        seconds: Math.ceil((Number(state.unfollow.nextAt) - now) / 1e3)
      });
    }
    return "";
  }
  function field(label, key, value, { min = 0, max = 9999, step = 1 } = {}) {
    return `<label class="ux-field"><span>${escapeHTML(
      label
    )}</span><input type="number" data-setting="${key}" value="${escapeAttr(
      value
    )}" min="${min}" max="${max}" step="${step}" inputmode="decimal"></label>`;
  }
  function settingsHTML(timings = {}, language = "en") {
    const t = makeT(language);
    const merged = { ...DEFAULT_TIMINGS, ...timings };
    const seconds = (value) => (Number(value) / 1e3).toFixed(1);
    return `<div class="ux-settings" data-settings-body>
    <div class="ux-settings-group">
      <div class="ux-settings-title">Scan</div>
      ${field(t("minScanDelay"), "scanDelayMin", seconds(merged.scanDelayMin), {
      min: 0.5,
      max: 60,
      step: 0.5
    })}
      ${field(t("maxScanDelay"), "scanDelayMax", seconds(merged.scanDelayMax), {
      min: 0.5,
      max: 60,
      step: 0.5
    })}
      ${field(t("scanPauseEvery"), "scanPauseEveryPages", merged.scanPauseEveryPages, {
      min: 1,
      max: 100
    })}
      ${field(t("scanPauseLength"), "scanPauseMs", seconds(merged.scanPauseMs), {
      min: 0,
      max: 600,
      step: 1
    })}
      ${field(t("usersPerRequest"), "usersPerRequest", merged.usersPerRequest, {
      min: 1,
      max: 100
    })}
    </div>
    <div class="ux-settings-group">
      <div class="ux-settings-title">Unfollow</div>
      ${field(
      t("minUnfollowDelay"),
      "unfollowDelayMin",
      seconds(merged.unfollowDelayMin),
      { min: 5, max: 120, step: 1 }
    )}
      ${field(
      t("maxUnfollowDelay"),
      "unfollowDelayMax",
      seconds(merged.unfollowDelayMax),
      { min: 5, max: 180, step: 1 }
    )}
      ${field(t("unfollowPauseEvery"), "unfollowPauseEvery", merged.unfollowPauseEvery, {
      min: 1,
      max: 200
    })}
      ${field(
      t("unfollowPauseLength"),
      "unfollowPauseMs",
      seconds(merged.unfollowPauseMs),
      { min: 0, max: 3600, step: 1 }
    )}
      ${field(t("maxUnfollows"), "maxUnfollows", merged.maxUnfollows, {
      min: 1,
      max: 400
    })}
    </div>
  </div>`;
  }
  function readSettings(root) {
    const read = (key, fallback) => {
      const element = root?.querySelector?.(`[data-setting="${key}"]`);
      const number = Number(element?.value);
      return Number.isFinite(number) ? number : fallback;
    };
    const scanDelayMin = clamp(read("scanDelayMin", 1.5) * 1e3, 500, 6e4);
    const scanDelayMax = Math.max(
      scanDelayMin,
      clamp(read("scanDelayMax", 2.5) * 1e3, 500, 6e4)
    );
    const unfollowDelayMin = clamp(
      read("unfollowDelayMin", 12) * 1e3,
      5e3,
      12e4
    );
    const unfollowDelayMax = Math.max(
      unfollowDelayMin,
      clamp(read("unfollowDelayMax", 20) * 1e3, 5e3, 18e4)
    );
    return {
      scanDelayMin,
      scanDelayMax,
      scanPauseEveryPages: Math.round(
        clamp(read("scanPauseEveryPages", 10), 1, 100)
      ),
      scanPauseMs: clamp(read("scanPauseMs", 10) * 1e3, 0, 6e5),
      usersPerRequest: Math.round(clamp(read("usersPerRequest", 50), 1, 100)),
      unfollowDelayMin,
      unfollowDelayMax,
      unfollowPauseEvery: Math.round(
        clamp(read("unfollowPauseEvery", 25), 1, 200)
      ),
      unfollowPauseMs: clamp(
        read("unfollowPauseMs", 300) * 1e3,
        0,
        36e5
      ),
      maxUnfollows: Math.round(clamp(read("maxUnfollows", 190), 1, 400))
    };
  }
  function showDialog({
    title,
    body = "",
    contentHTML = "",
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    extraLabel = "",
    destructive = false,
    onConfirm,
    onCancel,
    onExtra
  } = {}) {
    const host = document.getElementById(APP_ID) || document.body;
    const previousFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "ux-overlay";
    overlay.innerHTML = `<div class="ux-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(
      title
    )}">
    <h3>${escapeHTML(title)}</h3>
    ${body ? `<p>${escapeHTML(body)}</p>` : ""}
    ${contentHTML ? `<div class="ux-dialog-content">${contentHTML}</div>` : ""}
    <div class="ux-dialog-actions">
      ${extraLabel ? `<button class="ux-btn ux-btn-ghost" type="button" data-extra>${escapeHTML(extraLabel)}</button>` : ""}
      <button class="ux-btn ux-btn-soft" type="button" data-cancel>${escapeHTML(
      cancelLabel
    )}</button>
      <button class="ux-btn ${destructive ? "ux-btn-danger" : "ux-btn-primary"}" type="button" data-confirm>${escapeHTML(
      confirmLabel
    )}</button>
    </div>
  </div>`;
    host.appendChild(overlay);
    const focusables = () => [...overlay.querySelectorAll("button, input, select, textarea, [href]")].filter(
      (element) => !element.disabled
    );
    const close = () => {
      document.removeEventListener("keydown", onKey, true);
      overlay.remove();
      try {
        previousFocus?.focus?.();
      } catch {
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    overlay.querySelector("[data-confirm]")?.addEventListener("click", () => {
      onConfirm?.(overlay);
      close();
    });
    overlay.querySelector("[data-cancel]")?.addEventListener("click", () => {
      onCancel?.();
      close();
    });
    overlay.querySelector("[data-extra]")?.addEventListener("click", () => {
      onExtra?.(overlay);
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        onCancel?.();
        close();
      }
    });
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => {
      const target = overlay.querySelector("[data-confirm]") || overlay.querySelector("input") || overlay.querySelector("button");
      target?.focus?.();
    }, 0);
    return { overlay, close };
  }
  var toastTimer = null;
  function toast(message) {
    if (!message || typeof document === "undefined") return;
    const host = document.getElementById(APP_ID) || document.body;
    host.querySelectorAll(".ux-toast").forEach((node) => node.remove());
    const element = document.createElement("div");
    element.className = "ux-toast";
    element.setAttribute("role", "status");
    element.textContent = message;
    host.appendChild(element);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.remove(), 3500);
  }
  function applyPanelPosition(panel, position) {
    if (!panel) return;
    if (position && Number.isFinite(Number(position.left)) && Number.isFinite(Number(position.top))) {
      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - panel.offsetWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - panel.offsetHeight - margin);
      panel.style.left = `${clamp(Number(position.left), margin, maxLeft)}px`;
      panel.style.top = `${clamp(Number(position.top), margin, maxTop)}px`;
      panel.style.right = "auto";
    } else {
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "";
    }
  }
  function bindDrag(handle, panel, onEnd) {
    if (!handle || !panel || typeof handle.addEventListener !== "function") return;
    handle.style.touchAction = "none";
    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.("button, a, input")) return;
      const rect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const offsetX = startX - rect.left;
      const offsetY = startY - rect.top;
      panel.style.right = "auto";
      const move = (moveEvent) => {
        const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
        panel.style.left = `${clamp(moveEvent.clientX - offsetX, 8, maxLeft)}px`;
        panel.style.top = `${clamp(moveEvent.clientY - offsetY, 8, maxTop)}px`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        onEnd?.({
          left: Number.parseFloat(panel.style.left) || rect.left,
          top: Number.parseFloat(panel.style.top) || rect.top
        });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
      event.preventDefault();
    });
  }
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  function copyText(text, message) {
    const done = () => toast(message);
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          fallbackCopy(text);
          done();
        });
        return;
      }
    } catch {
    }
    fallbackCopy(text);
    done();
  }
  function fallbackCopy(text) {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    } catch {
    }
  }
  function mountUI({ state, onAction = () => {
  }, onChange = () => {
  } } = {}) {
    ensureStyles();
    document.getElementById(APP_ID)?.remove();
    const root = document.createElement("div");
    root.id = APP_ID;
    document.body.appendChild(root);
    const t = () => makeT(state.language);
    const updateResults = () => {
      const users = getDisplayUsers(state);
      const list = root.querySelector("[data-list]");
      if (list) {
        list.innerHTML = users.length ? users.map((user) => renderRow(user, state)).join("") : renderEmpty(state, t());
      }
      const count = root.querySelector("[data-result-count]");
      if (count) count.textContent = countLabel(state, t());
      const selectedCount = visibleSelectedCount(state);
      const selectedLabel = root.querySelector("[data-selected-count]");
      if (selectedLabel) {
        selectedLabel.textContent = t()("selectedCount", {
          count: selectedCount
        });
      }
      const unfollow = root.querySelector('[data-action="unfollow"]');
      if (unfollow) {
        unfollow.disabled = selectedCount === 0 || Boolean(state.unverified);
        unfollow.textContent = `${t()("unfollow")}${selectedCount ? ` (${selectedCount})` : ""}`;
      }
      const selectAll = root.querySelector("[data-select-all]");
      if (selectAll) {
        const selected = setOf(state.selected);
        const all = users.length > 0 && users.every((u) => selected.has(keyOf(u)));
        const some = users.some((u) => selected.has(keyOf(u)));
        selectAll.checked = all;
        selectAll.indeterminate = some && !all;
      }
      root.querySelectorAll("[data-filter]").forEach((button) => {
        const key = button.getAttribute("data-filter");
        button.classList.toggle("is-on", Boolean(state.filters?.[key]));
      });
    };
    const updateScanning = () => {
      const scanned = Number(state.scan?.scanned) || (state.users || []).length;
      const total = Number(state.scan?.total) || 0;
      const count = root.querySelector("[data-live-count]");
      if (count) count.textContent = countLabel(state, t());
      const bar = root.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = `${total ? clamp(scanned / total * 100, 0, 100) : 0}%`;
      }
      const page = root.querySelector("[data-scan-page]");
      if (page) {
        page.textContent = t()("scanningPage", {
          page: state.scan?.page || 1,
          count: scanned
        });
      }
      const hint = root.querySelector("[data-scan-hint]");
      if (hint) {
        hint.textContent = state.scan?.waiting ? t()("captureWait") : state.paused ? t()("pausedHint") : countdownText(state) || t()("liveHint");
      }
      const list = root.querySelector("[data-live-list]");
      if (list) {
        const users = getDisplayUsers(state).slice(0, 6);
        list.innerHTML = users.length ? users.map((user) => renderMiniRow(user, state)).join("") : `<div class="ux-empty">${escapeHTML(t()("liveEmpty"))}</div>`;
      }
    };
    const updateUnfollowing = () => {
      const run = state.unfollow || {};
      const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
      const total = Number(run.total) || 0;
      const bar = root.querySelector("[data-unfollow-progress]");
      if (bar) bar.style.width = `${total ? clamp(done / total * 100, 0, 100) : 0}%`;
      const current = root.querySelector(".ux-current");
      if (current) {
        current.textContent = t()("currently", { handle: run.current || "\u2014" });
      }
      const next = root.querySelector("[data-next]");
      if (next) next.textContent = countdownText(state);
    };
    const update = () => {
      if (!root.isConnected) return;
      if (state.minimized) {
        root.innerHTML = renderPill(state);
        return;
      }
      const view = root.querySelector("[data-view]");
      if (!view || view.getAttribute("data-view") !== state.mode) {
        render();
        return;
      }
      if (state.mode === "results") updateResults();
      else if (state.mode === "scanning") updateScanning();
      else if (state.mode === "unfollowing") updateUnfollowing();
    };
    const render = () => {
      root.innerHTML = state.minimized ? renderPill(state) : renderShell(state);
      if (!state.minimized) {
        const panel = root.querySelector("[data-panel]");
        const drag = root.querySelector("[data-drag]");
        applyPanelPosition(panel, state.panelPos);
        bindDrag(drag, panel, (position) => {
          state.panelPos = position;
          onChange();
        });
      }
    };
    const openSettings = () => {
      const dialog = showDialog({
        title: t()("settingsTitle"),
        body: t()("settingsBody"),
        contentHTML: settingsHTML(state.timings, state.language),
        confirmLabel: t()("save"),
        cancelLabel: t()("cancel"),
        extraLabel: t()("restoreDefaults"),
        onExtra: (overlay) => {
          const body = overlay.querySelector("[data-settings-body]");
          if (body) {
            const replacement = document.createElement("div");
            replacement.innerHTML = settingsHTML(
              DEFAULT_TIMINGS,
              state.language
            );
            const fresh = replacement.querySelector("[data-settings-body]");
            if (fresh) body.innerHTML = fresh.innerHTML;
          }
        },
        onConfirm: (overlay) => {
          const timings = readSettings(overlay);
          state.timings = timings;
          onAction("save-settings", timings);
        }
      });
      return dialog;
    };
    const openManualHandle = () => {
      showDialog({
        title: t()("manualHandle"),
        body: t()("manualHandleBody"),
        contentHTML: `<input class="ux-input" data-manual-handle placeholder="@handle" autocomplete="off" spellcheck="false">`,
        confirmLabel: t()("openFollowing"),
        cancelLabel: t()("cancel"),
        onConfirm: (overlay) => {
          const value = String(
            overlay.querySelector("[data-manual-handle]")?.value || ""
          ).trim().replace(/^@/, "");
          if (value) onAction("manual-handle", value);
        }
      });
    };
    const confirmUnfollow = () => {
      const selected = selectedUsers(state);
      if (!selected.length) {
        toast(t()("noSelection"));
        return;
      }
      if (state.unverified) return;
      const count = selected.length;
      showDialog({
        title: t()("unfollowConfirmTitle", { count }),
        body: t()("unfollowConfirmBody"),
        confirmLabel: t()("unfollowConfirmBtn", { count }),
        cancelLabel: t()("cancel"),
        destructive: true,
        onConfirm: () => onAction("start-unfollow")
      });
    };
    const onClick = (event) => {
      const actionElement = event.target.closest?.("[data-action]");
      if (actionElement) {
        const action = actionElement.getAttribute("data-action");
        const actions = /* @__PURE__ */ new Set([
          "toggle-language",
          "settings",
          "minimize",
          "expand",
          "close",
          "scan",
          "resume",
          "show-last",
          "manual-handle",
          "pause-scan",
          "resume-scan",
          "cancel-scan",
          "rescan",
          "copy-all",
          "select-none",
          "unfollow",
          "pause-unfollow",
          "resume-unfollow",
          "cancel-unfollow",
          "retry-scan",
          "back",
          "open-following"
        ]);
        if (actions.has(action)) {
          event.preventDefault();
          if (action === "settings") openSettings();
          else if (action === "manual-handle") openManualHandle();
          else if (action === "select-none") {
            state.selected = /* @__PURE__ */ new Set();
            onChange();
            update();
          } else if (action === "copy-all") {
            const handles = getDisplayUsers(state).map((user) => user.handle);
            if (handles.length) {
              copyText(
                handles.join("\n"),
                t()("copiedHandles", { count: handles.length })
              );
            }
          } else if (action === "unfollow") confirmUnfollow();
          else if (action === "minimize") {
            state.minimized = true;
            onChange();
            render();
          } else if (action === "expand") {
            state.minimized = false;
            onChange();
            render();
          } else onAction(action, actionElement);
          return;
        }
      }
      const filter = event.target.closest?.("[data-filter]");
      if (filter) {
        const key = filter.getAttribute("data-filter");
        state.filters = { ...DEFAULT_FILTERS, ...state.filters || {} };
        state.filters[key] = !state.filters[key];
        pruneSelection(state);
        onChange();
        update();
        return;
      }
      const hide = event.target.closest?.("[data-hide]");
      if (hide) {
        const key = hide.getAttribute("data-hide");
        if (!(state.hidden instanceof Set)) {
          state.hidden = new Set(state.hidden || []);
        }
        if (state.hidden.has(key)) state.hidden.delete(key);
        else state.hidden.add(key);
        onChange();
        update();
        return;
      }
      const copy = event.target.closest?.("[data-copy]");
      if (copy) {
        const handle = copy.getAttribute("data-copy");
        copyText(handle, t()("copiedToast"));
      }
    };
    const onChangeEvent = (event) => {
      const select = event.target.closest?.("[data-select]");
      if (select) {
        const key = select.getAttribute("data-select");
        if (!(state.selected instanceof Set)) {
          state.selected = new Set(state.selected || []);
        }
        if (select.checked) state.selected.add(key);
        else state.selected.delete(key);
        onChange();
        updateResults();
        return;
      }
      const all = event.target.closest?.("[data-select-all]");
      if (all) {
        const users = getDisplayUsers(state);
        if (!(state.selected instanceof Set)) {
          state.selected = new Set(state.selected || []);
        }
        for (const user of users) {
          const key = keyOf(user);
          if (all.checked) state.selected.add(key);
          else state.selected.delete(key);
        }
        onChange();
        updateResults();
      }
    };
    const onInput = (event) => {
      const search = event.target.closest?.("[data-search]");
      if (!search) return;
      state.search = search.value;
      onChange();
      updateResults();
    };
    root.addEventListener("click", onClick);
    root.addEventListener("change", onChangeEvent);
    root.addEventListener("input", onInput);
    render();
    return {
      root,
      render,
      update,
      toast,
      destroy() {
        root.removeEventListener("click", onClick);
        root.removeEventListener("change", onChangeEvent);
        root.removeEventListener("input", onInput);
        clearTimeout(toastTimer);
        toastTimer = null;
        root.querySelectorAll(".ux-toast").forEach((node) => node.remove());
        root.remove();
        document.getElementById(STYLE_ID)?.remove();
      }
    };
  }

  // src/main.js
  var ACTIVE = null;
  function mergeScan(existing, incoming) {
    const byHandle = /* @__PURE__ */ new Map();
    const list = [
      ...Array.isArray(existing) ? existing : [],
      ...Array.isArray(incoming) ? incoming : []
    ];
    for (const user of list) {
      if (!user || !user.handle) continue;
      const key = user.handle.toLowerCase();
      const previous = byHandle.get(key);
      if (!previous) {
        byHandle.set(key, user);
        continue;
      }
      byHandle.set(key, {
        ...previous,
        ...user,
        id: user.id || previous.id,
        name: user.name || previous.name,
        avatar: user.avatar || previous.avatar,
        verified: Boolean(user.verified || previous.verified),
        protected: Boolean(user.protected || previous.protected),
        followsViewer: user.followsViewer === true || user.followsViewer === false || user.followsViewer === null ? user.followsViewer : previous.followsViewer
      });
    }
    return dedupeUsers([...byHandle.values()]);
  }
  function coverageFrom(users) {
    const list = Array.isArray(users) ? users.filter(Boolean) : [];
    const sawFollowedBy = list.some(
      (user) => typeof user.followsViewer === "boolean"
    );
    const missing = list.some(
      (user) => user.followsViewer === null || user.followsViewer === void 0
    );
    return {
      unverified: list.length > 0 && (!sawFollowedBy || missing),
      sawFollowedBy,
      missing
    };
  }
  function canUnfollow(state) {
    const selected = state?.selected instanceof Set ? state.selected : new Set(Array.isArray(state?.selected) ? state.selected : []);
    return Boolean(state && !state.unverified && selected.size > 0);
  }
  function normalizeTimings(raw) {
    const merged = { ...DEFAULT_TIMINGS, ...raw || {} };
    for (const key of Object.keys(DEFAULT_TIMINGS)) {
      const number = Number(merged[key]);
      merged[key] = Number.isFinite(number) && number >= 0 ? number : DEFAULT_TIMINGS[key];
    }
    return merged;
  }
  function createState() {
    const stored = loadState();
    return {
      mode: "idle",
      language: stored.language === "tr" ? "tr" : "en",
      viewer: { handle: "", id: "" },
      users: [],
      hidden: new Set(
        Array.isArray(stored.hidden) ? stored.hidden.map(String) : []
      ),
      selected: /* @__PURE__ */ new Set(),
      filters: { ...DEFAULT_FILTERS, ...stored.filters || {} },
      search: "",
      timings: normalizeTimings(stored.timings),
      panelPos: stored.panelPos && typeof stored.panelPos === "object" ? stored.panelPos : null,
      minimized: Boolean(stored.minimized),
      scan: {
        scanned: 0,
        total: null,
        page: 0,
        cursor: "",
        source: "api",
        waiting: false
      },
      source: "api",
      unverified: false,
      partial: false,
      paused: false,
      checkpoint: null,
      lastScan: null,
      error: "",
      cooldownUntil: 0,
      scanPauseUntil: 0,
      unfollow: {
        current: null,
        total: 0,
        ok: 0,
        fail: 0,
        remaining: 0,
        nextAt: 0,
        log: [],
        transport: "mutation"
      },
      active: {
        running: false,
        paused: false,
        cancelled: false,
        abort: null,
        wake: null
      },
      disposed: false,
      ui: null,
      cleanup: null
    };
  }
  function persist(state) {
    persistState(void 0, {
      language: state.language,
      hidden: [...state.hidden],
      timings: state.timings,
      filters: state.filters,
      panelPos: state.panelPos,
      minimized: state.minimized
    });
  }
  function bareHandleFromHref(href) {
    try {
      const raw = String(href || "");
      const path = /^https?:/i.test(raw) ? new URL(raw).pathname : raw.split(/[?#]/)[0];
      return path.replace(/^\/+/, "").replace(/\/+$/, "");
    } catch {
      return "";
    }
  }
  function resolveHandle(state) {
    if (typeof document !== "undefined") {
      const link = document.querySelector(
        '[data-testid="AppTabBar_Profile_Link"]'
      );
      if (link) {
        const handle = bareHandleFromHref(link.getAttribute("href"));
        if (handle) {
          state.viewer.handle = handle;
          state.viewer.id = parseTwid(getCookie("twid"));
          return handle;
        }
      }
    }
    if (typeof location !== "undefined") {
      const first = location.pathname.split("/").filter(Boolean)[0];
      if (first && /^[A-Za-z0-9_]{1,15}$/.test(first) && !RESERVED.has(first.toLowerCase())) {
        state.viewer.handle = first;
        state.viewer.id = parseTwid(getCookie("twid"));
        return first;
      }
    }
    return state.viewer.handle || "";
  }
  function cleanupExisting() {
    try {
      globalThis.__uxCleanup?.();
    } catch {
    }
    try {
      document.getElementById(APP_ID)?.remove();
      document.getElementById(STYLE_ID)?.remove();
    } catch {
    }
  }
  function waitFor(state, predicate, timeoutMs) {
    return new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        let result = false;
        try {
          result = Boolean(predicate());
        } catch {
          result = false;
        }
        if (result) return resolve(true);
        if (state.active.cancelled) return resolve(false);
        if (Date.now() - started >= timeoutMs) return resolve(false);
        setTimeout(tick, 150);
      };
      tick();
    });
  }
  function abortError() {
    const error = new Error("Aborted");
    error.kind = "aborted";
    return error;
  }
  function isFatalScanError(error) {
    return error?.kind === "rate" || error?.kind === "auth" || error?.kind === "blocked";
  }
  function boot() {
    cleanupExisting();
    const state = createState();
    resolveHandle(state);
    const ui = mountUI({
      state,
      onAction: (action, payload) => handleAction(action, payload),
      onChange: () => persist(state)
    });
    state.ui = ui;
    state.checkpoint = loadCheckpoint(void 0, state.viewer.handle);
    state.lastScan = loadLastScan(void 0, state.viewer.handle);
    installCapture();
    ui.render();
    const t = () => makeT(state.language);
    let pauseTimer = null;
    function checkpointNow(stopReason = null) {
      if (!state.users.length || !state.viewer.handle) return;
      const checkpoint = {
        viewerHandle: state.viewer.handle,
        users: state.users,
        cursor: state.scan.cursor || "",
        total: state.scan.total,
        source: state.source,
        unverified: state.unverified,
        savedAt: Date.now(),
        stopReason
      };
      saveCheckpoint(void 0, checkpoint);
      state.checkpoint = checkpoint;
    }
    function snapshotLastScan() {
      if (!state.viewer.handle) return;
      const snapshot = {
        viewerHandle: state.viewer.handle,
        users: state.users,
        unverified: state.unverified,
        source: state.source,
        total: state.scan.total,
        savedAt: Date.now()
      };
      saveLastScan(void 0, snapshot);
      state.lastScan = snapshot;
    }
    function activeSleep(ms) {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (state.active.wake === finish) state.active.wake = null;
          resolve();
        };
        const timer = setTimeout(finish, Math.max(0, ms));
        state.active.wake = finish;
      });
    }
    function queueSleep(ms) {
      const paused = state.active.paused;
      return new Promise((resolve) => {
        const until = Date.now() + Math.max(0, ms);
        if (!paused) {
          state.unfollow.nextAt = until;
          ui.update();
        }
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          clearInterval(ticker);
          state.unfollow.nextAt = 0;
          if (state.active.wake === finish) state.active.wake = null;
          ui.update();
          resolve();
        };
        const timer = setTimeout(finish, Math.max(0, ms));
        const ticker = paused ? null : setInterval(() => ui.update(), 500);
        state.active.wake = finish;
      });
    }
    async function waitForCaptured(timeoutMs) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (state.active.cancelled) return null;
        const template = getCapturedFollowing();
        if (template) return template;
        await activeSleep(300);
      }
      return null;
    }
    function setHandle(value) {
      const raw = String(value || "").trim();
      const withoutUrl = raw.replace(
        /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i,
        ""
      );
      const handle = withoutUrl.split(/[/?#]/)[0].replace(/^@/, "").trim();
      if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
        ui.toast(t()("manualHandleBody"));
        return false;
      }
      state.viewer.handle = handle;
      state.viewer.id = parseTwid(getCookie("twid"));
      state.checkpoint = loadCheckpoint(void 0, handle);
      state.lastScan = loadLastScan(void 0, handle);
      state.users = [];
      state.selected = /* @__PURE__ */ new Set();
      state.mode = "idle";
      state.error = "";
      ui.render();
      return true;
    }
    function requestManualHandle() {
      showDialog({
        title: t()("manualHandle"),
        body: t()("manualHandleBody"),
        contentHTML: '<input class="ux-input" data-manual-handle placeholder="@handle" autocomplete="off" spellcheck="false">',
        confirmLabel: t()("openFollowing"),
        cancelLabel: t()("cancel"),
        onConfirm: (overlay) => {
          const value = String(
            overlay.querySelector("[data-manual-handle]")?.value || ""
          ).trim().replace(/^@/, "");
          if (value && setHandle(value)) {
            startScan(false);
          }
        }
      });
    }
    function ensureSession() {
      const csrf = getCookie("ct0");
      if (!csrf) {
        state.mode = "error";
        state.error = t()("cookieMissing");
        ui.render();
        return null;
      }
      const handle = state.viewer.handle || resolveHandle(state);
      if (!handle) {
        requestManualHandle();
        return null;
      }
      state.viewer.handle = handle;
      state.viewer.id = state.viewer.id || parseTwid(getCookie("twid"));
      return {
        csrf,
        handle,
        userId: state.viewer.id,
        origin: typeof location !== "undefined" && location.origin ? location.origin : "https://x.com"
      };
    }
    async function ensureFollowingPage(handle) {
      if (typeof location === "undefined") return false;
      const target = `/${handle}/following`.toLowerCase();
      const current = location.pathname.replace(/\/+$/, "").toLowerCase();
      if (current === target) return true;
      const allLinks = () => [...document.querySelectorAll("a[href]")];
      const matching = allLinks().find(
        (anchor) => isProfileHref(anchor.getAttribute("href")) && bareHandleFromHref(anchor.getAttribute("href")).toLowerCase() === handle.toLowerCase()
      );
      const navLink = document.querySelector(
        '[data-testid="AppTabBar_Profile_Link"]'
      );
      const navHandle = bareHandleFromHref(
        navLink?.getAttribute("href")
      ).toLowerCase();
      const profile = matching || (navHandle === handle.toLowerCase() ? navLink : null);
      if (profile) {
        profile.click();
        await waitFor(
          state,
          () => location.pathname.replace(/\/+$/, "").toLowerCase().startsWith(`/${handle.toLowerCase()}`),
          5e3
        );
      }
      if (state.active.cancelled) return false;
      const following = allLinks().find((anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) return false;
        const path = bareHandleFromHref(href).toLowerCase();
        return path === `${handle.toLowerCase()}/following`;
      });
      if (!following) return false;
      following.click();
      return waitFor(
        state,
        () => location.pathname.replace(/\/+$/, "").toLowerCase() === target,
        12e3
      );
    }
    function handlePage(payload) {
      if (state.disposed) return;
      state.users = mergeScan(
        state.users,
        payload.allUsers || payload.users || []
      );
      state.source = payload.source || state.source;
      const total = payload.total;
      state.scan = {
        ...state.scan,
        scanned: state.users.length,
        total: total === null || total === void 0 ? state.scan.total : Number(total),
        page: payload.page || state.scan.page,
        cursor: payload.nextCursor || "",
        source: state.source,
        waiting: false
      };
      const coverage = coverageFrom(state.users);
      state.unverified = payload.unverified === true || coverage.unverified;
      checkpointNow(null);
      ui.update();
    }
    function handleStatus(event) {
      if (state.disposed) return;
      if (event.kind === "pause") {
        state.scanPauseUntil = Date.now() + Number(event.ms || 0);
        ui.update();
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          if (state.scanPauseUntil && state.scanPauseUntil <= Date.now()) {
            state.scanPauseUntil = 0;
            ui.update();
          }
        }, Number(event.ms || 0) + 50);
      } else if (event.kind === "paused") {
        if (!state.paused) {
          state.paused = true;
          ui.render();
        }
      }
    }
    function finishScan(result) {
      if (state.disposed) return;
      state.users = mergeScan(state.users, result.users || []);
      state.source = result.source || state.source;
      state.scan = {
        ...state.scan,
        scanned: state.users.length,
        total: result.total === null || result.total === void 0 ? state.scan.total : Number(result.total),
        page: result.pages ?? state.scan.page,
        source: state.source,
        waiting: false
      };
      state.unverified = result.unverified === true || coverageFrom(state.users).unverified;
      const truncated = result.stopReason === "maxUsers" || result.stopReason === "maxPages";
      state.partial = truncated;
      state.mode = "results";
      state.paused = false;
      state.scanPauseUntil = 0;
      state.active.running = false;
      state.active.wake = null;
      if (truncated) {
        checkpointNow(result.stopReason);
      } else {
        state.checkpoint = null;
        clearCheckpoint(void 0);
      }
      state.error = state.source === "dom" && state.users.length === 0 ? t()("domEmpty") : "";
      snapshotLastScan();
      ui.render();
      const count = state.users.filter(
        (user) => user.followsViewer !== true
      ).length;
      ui.toast(t()("scanCompletedToast", { count }));
    }
    function handleScanError(error) {
      if (state.disposed) return;
      state.active.running = false;
      state.active.paused = false;
      state.active.wake = null;
      state.paused = false;
      state.scanPauseUntil = 0;
      const kind = error?.kind;
      const hasUsers = state.users.length > 0;
      if (state.active.cancelled || kind === "aborted") {
        state.mode = hasUsers ? "results" : "idle";
        state.partial = hasUsers;
        state.error = "";
        if (hasUsers) {
          checkpointNow("cancelled");
          snapshotLastScan();
        }
        ui.render();
        return;
      }
      if (hasUsers) {
        checkpointNow(kind);
        snapshotLastScan();
      }
      state.mode = hasUsers ? "results" : "error";
      state.partial = hasUsers;
      if (kind === "rate") {
        const until = Number(error.resetAt) || Date.now() + Number(error.retryAfter || COOLDOWN_MS.rate);
        state.cooldownUntil = until;
        state.error = t()("tooManyRequests", {
          time: formatClock(until)
        });
      } else if (kind === "auth") {
        state.error = t()("sessionExpired");
      } else if (kind === "blocked") {
        state.error = t()("scanBlocked");
      } else if (kind === "network") {
        state.error = t()("networkError");
      } else {
        state.error = t()("requestFailed", {
          status: error?.status || "?"
        });
      }
      ui.render();
    }
    async function startScan(resume = false) {
      if (state.active.running || state.disposed) return;
      const handle = state.viewer.handle || resolveHandle(state);
      if (!handle) {
        requestManualHandle();
        return;
      }
      const session = ensureSession();
      if (!session) return;
      const useResume = Boolean(resume && state.checkpoint);
      state.error = "";
      state.partial = false;
      state.paused = false;
      state.cooldownUntil = 0;
      state.scanPauseUntil = 0;
      clearTimeout(pauseTimer);
      state.unverified = useResume ? Boolean(state.checkpoint.unverified) : false;
      state.mode = "scanning";
      state.source = useResume ? state.checkpoint.source || "api" : "api";
      state.scan = {
        scanned: 0,
        total: null,
        page: 0,
        cursor: "",
        source: state.source,
        waiting: true
      };
      if (useResume) {
        state.users = dedupeUsers(state.checkpoint.users || []);
        state.scan.scanned = state.users.length;
        state.scan.total = state.checkpoint.total === null || state.checkpoint.total === void 0 ? null : Number.isFinite(Number(state.checkpoint.total)) ? Number(state.checkpoint.total) : null;
        state.scan.cursor = state.checkpoint.cursor || "";
        state.scan.source = state.checkpoint.source || "api";
      } else {
        state.users = [];
        state.selected = /* @__PURE__ */ new Set();
        state.checkpoint = null;
        clearCheckpoint(void 0);
      }
      state.active = {
        running: true,
        paused: false,
        cancelled: false,
        abort: new AbortController(),
        wake: null
      };
      ui.render();
      const onFollowing = await ensureFollowingPage(handle);
      if (state.active.cancelled) {
        handleScanError(abortError());
        return;
      }
      if (!onFollowing) {
        state.active.running = false;
        state.mode = "error";
        state.error = t()("navFailed", {
          url: `https://x.com/${handle}/following`
        });
        ui.render();
        return;
      }
      state.scan.waiting = true;
      ui.render();
      let template = getCapturedFollowing();
      if (!template) {
        try {
          window.scrollBy(0, Math.max(320, window.innerHeight * 0.75));
        } catch {
        }
        template = await waitForCaptured(SCAN_LIMITS.captureWaitMs);
      }
      if (state.active.cancelled) {
        handleScanError(abortError());
        return;
      }
      state.scan.waiting = false;
      ui.update();
      const resumeCursor = useResume ? state.scan.cursor : "";
      const resumeSeed = useResume ? state.users : [];
      const resumeTotal = useResume ? state.scan.total : null;
      const scanOptions = {
        handle,
        userId: session.userId,
        csrf: session.csrf,
        signal: state.active.abort.signal,
        timings: state.timings,
        onPage: handlePage,
        onStatus: handleStatus,
        shouldPause: () => state.active.paused,
        shouldCancel: () => state.active.cancelled,
        sleepFn: (ms) => activeSleep(ms)
      };
      let lastError = null;
      if (template) {
        try {
          const result = await scanFollowing({
            ...scanOptions,
            template,
            startCursor: resumeCursor,
            seedUsers: resumeSeed,
            seedTotal: resumeTotal
          });
          finishScan(result);
          return;
        } catch (error) {
          lastError = error;
          if (state.active.cancelled || error.kind === "aborted") {
            handleScanError(error);
            return;
          }
          if (isFatalScanError(error)) {
            handleScanError(error);
            return;
          }
        }
      }
      for (const fallback of buildDefaultTemplates({
        handle,
        userId: session.userId
      })) {
        if (state.active.cancelled) break;
        try {
          const result = await scanFollowing({
            ...scanOptions,
            template: fallback,
            startCursor: "",
            seedUsers: state.users,
            seedTotal: state.scan.total
          });
          finishScan(result);
          return;
        } catch (error) {
          lastError = error;
          if (state.active.cancelled || error.kind === "aborted") {
            handleScanError(error);
            return;
          }
          if (isFatalScanError(error)) break;
        }
      }
      if (state.active.cancelled || lastError?.kind === "aborted") {
        handleScanError(lastError || abortError());
        return;
      }
      if (isFatalScanError(lastError)) {
        handleScanError(lastError);
        return;
      }
      try {
        const result = await scanDom({
          onPage: handlePage,
          signal: state.active.abort.signal,
          sleepFn: (ms) => activeSleep(ms),
          win: window,
          maxUsers: SCAN_LIMITS.maxUsers
        });
        finishScan({
          ...result,
          source: "dom",
          pages: result.rounds
        });
      } catch (error) {
        handleScanError(error || lastError);
      }
    }
    function cancelScan() {
      if (!state.active.running) {
        state.mode = state.users.length ? "results" : "idle";
        ui.render();
        return;
      }
      state.active.cancelled = true;
      state.active.paused = false;
      state.paused = false;
      state.active.wake?.();
      state.active.abort?.abort();
      ui.toast(t()("cancel"));
    }
    function showLastScan() {
      const scan = state.lastScan || loadLastScan(void 0, state.viewer.handle);
      if (!scan) {
        ui.toast(t()("lastScanEmpty"));
        return;
      }
      state.lastScan = scan;
      state.users = dedupeUsers(scan.users || []);
      state.unverified = Boolean(scan.unverified);
      state.source = scan.source || "api";
      state.scan = {
        scanned: state.users.length,
        total: scan.total === null || scan.total === void 0 ? null : Number.isFinite(Number(scan.total)) ? Number(scan.total) : null,
        page: 0,
        cursor: "",
        source: state.source,
        waiting: false
      };
      state.mode = "results";
      state.partial = false;
      state.paused = false;
      state.error = "";
      state.selected = /* @__PURE__ */ new Set();
      ui.render();
      ui.toast(
        t()("lastScanNotice", {
          time: timeAgo(scan.savedAt, state.language)
        })
      );
    }
    async function startUnfollow() {
      if (state.active.running || state.disposed) return;
      if (!canUnfollow(state)) {
        ui.toast(t()("noSelection"));
        return;
      }
      if (state.unverified) {
        ui.toast(t()("unverified"));
        return;
      }
      const session = ensureSession();
      if (!session) return;
      const selected = state.users.filter(
        (user) => user && user.handle && state.selected instanceof Set && state.selected.has(keyOf(user))
      );
      if (!selected.length) {
        ui.toast(t()("noSelection"));
        return;
      }
      if (selected.some((user) => user.followsViewer !== false)) {
        ui.toast(t()("unverified"));
        return;
      }
      const cap = Math.max(
        1,
        Math.min(400, Number(state.timings.maxUnfollows) || 190)
      );
      const targets = selected.slice(0, cap);
      if (selected.length > cap) {
        ui.toast(t()("capNotice", { max: cap }));
      }
      state.mode = "unfollowing";
      state.paused = false;
      state.error = "";
      state.cooldownUntil = 0;
      state.unfollow = {
        current: null,
        total: targets.length,
        ok: 0,
        fail: 0,
        remaining: targets.length,
        nextAt: 0,
        log: [],
        transport: "mutation"
      };
      state.active = {
        running: true,
        paused: false,
        cancelled: false,
        abort: new AbortController(),
        wake: null
      };
      ui.render();
      const ctx = {
        csrf: session.csrf,
        bearer: BEARER,
        handle: session.handle,
        userId: session.userId,
        origin: session.origin,
        fetchImpl: globalThis.fetch,
        root: document,
        timings: state.timings,
        sleep: (ms) => queueSleep(ms),
        random: Math.random,
        findRow: (user) => findRowByHandle(document, user.handle)
      };
      const onProgress = (event) => {
        if (state.disposed) return;
        if (event.counts) {
          state.unfollow.ok = Number(event.counts.ok) || 0;
          state.unfollow.fail = Number(event.counts.fail) || 0;
        }
        state.unfollow.transport = event.transport || state.unfollow.transport;
        if (event.total) state.unfollow.total = event.total;
        if (event.kind === "result") {
          state.unfollow.current = event.user?.handle || state.unfollow.current;
          if (event.ok && event.user) {
            const key = keyOf(event.user);
            state.users = state.users.filter((user) => keyOf(user) !== key);
            state.selected.delete(key);
          }
          state.unfollow.log.push({
            handle: event.user?.handle || "",
            ok: Boolean(event.ok),
            reason: event.reason || ""
          });
          state.unfollow.remaining = Math.max(
            0,
            state.unfollow.total - (state.unfollow.ok + state.unfollow.fail)
          );
          snapshotLastScan();
          ui.render();
        } else if (event.kind === "downgrade") {
          ui.toast(
            event.to === "ui" ? t()("uiFallback") : t()("transportDowngrade")
          );
          ui.render();
        } else if (event.kind === "long-pause") {
          ui.toast(
            t()("scanPause", {
              seconds: Math.round(Number(event.ms || 0) / 1e3)
            })
          );
          ui.update();
        } else if (event.kind === "paused") {
          state.paused = true;
          ui.render();
        } else if (event.kind === "delay") {
          state.unfollow.nextAt = Date.now() + Number(event.ms || 0);
          ui.update();
        }
      };
      let output;
      try {
        output = await runUnfollowQueue({
          targets,
          ctx,
          max: targets.length,
          shouldPause: () => state.active.paused,
          shouldCancel: () => state.active.cancelled,
          onProgress
        });
      } catch (error) {
        output = {
          ok: state.unfollow.ok,
          fail: state.unfollow.fail + 1,
          processed: state.unfollow.ok + state.unfollow.fail + 1,
          remaining: state.unfollow.remaining,
          stopped: "network",
          transport: state.unfollow.transport,
          results: [],
          stopInfo: error
        };
      }
      if (state.disposed) return;
      state.active.running = false;
      state.active.paused = false;
      state.active.wake = null;
      state.paused = false;
      state.unfollow.ok = Number(output.ok) || 0;
      state.unfollow.fail = Number(output.fail) || 0;
      const overflow = Math.max(0, selected.length - targets.length);
      state.unfollow.remaining = (Number(output.remaining) || 0) + overflow;
      state.unfollow.transport = output.transport || state.unfollow.transport;
      state.unfollow.current = null;
      state.unfollow.nextAt = 0;
      if (output.stopped === "rate" || output.stopped === "blocked") {
        const until = Number(output.stopInfo?.resetAt) || Date.now() + Number(
          output.stopInfo?.retryAfter || (output.stopped === "rate" ? COOLDOWN_MS.rate : COOLDOWN_MS.blocked)
        );
        state.cooldownUntil = until;
        ui.toast(
          output.stopped === "rate" ? t()("tooManyRequests", { time: formatClock(until) }) : t()("unfollowBlocked")
        );
      } else if (output.stopped === "auth") {
        ui.toast(t()("sessionExpired"));
      } else if (output.stopped === "network") {
        ui.toast(t()("networkError"));
      }
      snapshotLastScan();
      state.mode = "done";
      ui.render();
    }
    function handleAction(action, payload) {
      if (state.disposed) return;
      if (action === "toggle-language") {
        state.language = state.language === "tr" ? "en" : "tr";
        persist(state);
        ui.render();
        return;
      }
      if (action === "save-settings") {
        state.timings = normalizeTimings(payload || state.timings);
        persist(state);
        ui.toast(t()("settingsSaved"));
        return;
      }
      if (action === "scan") {
        startScan(false);
        return;
      }
      if (action === "resume") {
        startScan(true);
        return;
      }
      if (action === "show-last") {
        showLastScan();
        return;
      }
      if (action === "rescan") {
        startScan(false);
        return;
      }
      if (action === "pause-scan") {
        if (state.active.running) {
          state.active.paused = true;
          state.paused = true;
          ui.render();
        }
        return;
      }
      if (action === "resume-scan") {
        state.active.paused = false;
        state.paused = false;
        ui.render();
        return;
      }
      if (action === "cancel-scan") {
        cancelScan();
        return;
      }
      if (action === "start-unfollow") {
        startUnfollow();
        return;
      }
      if (action === "pause-unfollow") {
        if (state.active.running) {
          state.active.paused = true;
          state.paused = true;
          ui.render();
        }
        return;
      }
      if (action === "resume-unfollow") {
        state.active.paused = false;
        state.paused = false;
        ui.render();
        return;
      }
      if (action === "cancel-unfollow") {
        state.active.cancelled = true;
        state.active.wake?.();
        return;
      }
      if (action === "manual-handle") {
        if (setHandle(payload)) startScan(false);
        return;
      }
      if (action === "retry-scan") {
        startScan(Boolean(state.checkpoint && state.users.length));
        return;
      }
      if (action === "back") {
        state.mode = state.users.length ? "results" : "idle";
        state.error = "";
        ui.render();
        return;
      }
      if (action === "open-following") {
        const handle = state.viewer.handle;
        if (!handle) return;
        ensureFollowingPage(handle).then((ok) => {
          if (!ok) {
            ui.toast(
              t()("navFailed", {
                url: `https://x.com/${handle}/following`
              })
            );
          }
        });
        return;
      }
      if (action === "close") {
        state.cleanup?.();
      }
    }
    function onVisibility() {
      if (typeof document !== "undefined" && document.hidden && state.active.running) {
        state.active.paused = true;
        state.paused = true;
        ui.toast(t()("keepTabVisible"));
        ui.render();
      }
    }
    const cleanup = () => {
      if (state.disposed) return;
      state.disposed = true;
      state.active.cancelled = true;
      state.active.wake?.();
      state.active.abort?.abort();
      clearTimeout(pauseTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      uninstallCapture();
      ui.destroy();
      if (globalThis.__uxCleanup === cleanup) {
        delete globalThis.__uxCleanup;
      }
      if (ACTIVE === state) ACTIVE = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    globalThis.__uxCleanup = cleanup;
    ACTIVE = state;
    state.cleanup = cleanup;
    return state;
  }

  // src/index.js
  var HOSTS = /* @__PURE__ */ new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);
  if (typeof globalThis.__UX_TEST__ === "function") {
    globalThis.__UX_TEST__({ boot, mergeScan, canUnfollow, coverageFrom });
  } else if (!HOSTS.has(location.hostname)) {
    alert("Open https://x.com first, then paste this script again.");
  } else {
    boot();
  }
})();
