/* Unfollow X — paste into the console on x.com. See README.md. */
(() => {
  // src/config.js
  var VERSION = "0.3.1";
  var APP_ID = "ux-app";
  var STYLE_ID = "ux-style";
  var STORAGE_KEY = "ux_state_v1";
  var CHECKPOINT_KEY = "ux_scan_v1";
  var LAST_SCAN_KEY = "ux_last_scan_v1";
  var ACTIVITY_KEY = "ux_activity_v1";
  var ACTIVITY_SCAN_KEY = "ux_activity_scan_v1";
  var ACTIVITY_TTL = 24 * 60 * 60 * 1e3;
  var ACTIVITY_BATCH_SIZE = 10;
  var ACTIVITY_DEFAULT_DAYS = 30;
  var ACTIVITY_MIN_DAYS = 1;
  var ACTIVITY_MAX_DAYS = 365;
  var ACTIVITY_QUERY_IDS = [
    "ekwzBXpJcRI38DI6gJk_OQ",
    "Vg5aF036K40ST3FWvnvRGA",
    "_dEwIMW2hHUTejaIafUiLA",
    "M9Tz6NGTHeRzqHOPdj9I7g"
  ];
  var ACTIVITY_QUERY_ID = ACTIVITY_QUERY_IDS[0];
  var ACTIVITY_FEATURES = {
    articles_preview_enabled: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    communities_web_enable_tweet_community_results_fetch: true,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_grok_community_note_auto_translation_is_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_grok_imagine_annotation_enabled: false,
    responsive_web_media_download_video_enabled: false,
    responsive_web_profile_redirect_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    rweb_tipjar_consumption_enabled: true,
    rweb_video_timestamps_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_awards_web_tipping_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    verified_phone_label_enabled: false,
    view_counts_everywhere_api_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    premium_content_api_read_enabled: false,
    profile_label_improvements_pcf_label_in_post_enabled: false,
    responsive_web_grok_share_attachment_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: false,
    responsive_web_grok_image_annotation_enabled: false,
    responsive_web_grok_analysis_button_from_backend: false,
    responsive_web_jetfuel_frame: false,
    rweb_video_screen_enabled: true,
    responsive_web_grok_show_grok_translated_post: true
  };
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
  var PANEL = {
    margin: 16,
    width: 424,
    top: 68,
    right: 18
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
      movePanel: "Move panel. Arrow keys move, Home resets.",
      auditKicker: "Following audit",
      nonFollowersUnit: "non-followers",
      nonFollowersUnitOne: "non-follower",
      processedUnit: "processed",
      statOk: "successful",
      statFail: "failed",
      statLeft: "remaining",
      unfollowedStamp: "unfollowed",
      failedStamp: "failed",
      settingsScan: "Scan",
      settingsUnfollow: "Unfollow",
      scanBtn: "Scan now",
      scanning: "Scanning\u2026",
      loadingFollowing: "Loading your following list\u2026",
      liveFound: "{count} non-followers so far",
      liveWaiting: "Waiting for data\u2026",
      liveHint: "Keep this tab visible. X loads the list as you scroll.",
      captureWait: "Waiting for X to send the following request\u2026",
      domScanHint: "Scanning the visible list. Scroll the page if it stalls.",
      scanningPage: "Page {page}, {count} scanned",
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
      activityBlocked: "X blocked the activity scan. Wait a few hours and retry.",
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
      tabNonFollowers: "Non-followers",
      tabInactive: "Inactive",
      activityKicker: "Activity audit",
      activityBody: "Find accounts you follow that have not posted, reposted, or replied in the last {days} days.",
      activityStart: "Start activity scan",
      activityScanning: "Checking activity\u2026",
      activityHint: "Keep this tab visible. You can pause or cancel at any time.",
      activityProgress: "{checked} / {total} checked",
      activityCurrent: "Now: @{handle}",
      activityFound: "{count} inactive accounts",
      activityFoundOne: "1 inactive account",
      activityUnit: "inactive accounts",
      activityUnitOne: "inactive account",
      activityNone: "No inactive accounts in this window",
      activityLiveEmpty: "Found inactive accounts will appear here.",
      activityNever: "No posts yet",
      activityLastPost: "Last post: {time}",
      activityLastCheck: "Last check: {time}",
      activityUnknown: "Could not check",
      activityUnknownCount: "{count} accounts could not be checked",
      activityReasonNoId: "No user ID",
      activityReasonNotFound: "Not found",
      activityReasonTemplate: "Query failed",
      activityReasonProtected: "Protected",
      activityReasonRate: "Rate limited",
      activityReasonUnavailable: "Unavailable",
      activityFresh: "Activity data is up to date",
      activityNeedsScan: "Scan your following list first",
      activityPartial: "{count} accounts checked. Continue to finish.",
      activityClear: "Clear activity data",
      activityCleared: "Activity data cleared",
      activityClearTitle: "Clear activity data?",
      activityClearBody: "Last post times and check records will be removed from this device.",
      activityFallback: "Batch check unavailable; switching to profile checks",
      activityGraphqlHint: "X rejected the activity request; reload the page and retry",
      activityCacheWarning: "Could not save activity cache; progress will be lost on reload.",
      activityFollowsWarning: "{count} selected accounts follow you. Unfollow anyway?",
      activityUnfollowTitle: "Unfollow {count} inactive accounts?",
      activityUnfollowBody: "This cannot be undone. These accounts may follow you back.",
      activityDoneToast: "Activity scan complete: {count} inactive accounts.",
      activityDays: "Inactive threshold (days)",
      activitySourceBatch: "Batch",
      activitySourceProfile: "Profile",
      pillInactive: "{count} inactive",
      pillActivity: "Checking activity",
      unfollowPausedHint: "The run is paused. Resume when you are ready."
    },
    tr: {
      appTitle: "Unfollow X",
      subtitle: "Seni geri takip etmeyenleri bul.",
      movePanel: "Paneli ta\u015F\u0131. Ok tu\u015Flar\u0131 ta\u015F\u0131r, Home s\u0131f\u0131rlar.",
      auditKicker: "Takip denetimi",
      nonFollowersUnit: "takip etmiyor",
      nonFollowersUnitOne: "takip etmiyor",
      processedUnit: "i\u015Flendi",
      statOk: "ba\u015Far\u0131l\u0131",
      statFail: "hata",
      statLeft: "kalan",
      unfollowedStamp: "\xE7\u0131kt\u0131",
      failedStamp: "hata",
      settingsScan: "Tarama",
      settingsUnfollow: "Takipten \xE7\u0131karma",
      scanBtn: "Taramay\u0131 ba\u015Flat",
      scanning: "Taran\u0131yor\u2026",
      loadingFollowing: "Takip listen y\xFCkleniyor\u2026",
      liveFound: "\u015Eu ana kadar {count} takip etmeyen",
      liveWaiting: "Veri bekleniyor\u2026",
      liveHint: "Bu sekmeyi g\xF6r\xFCn\xFCr tut. X listeyi kayd\u0131rd\u0131k\xE7a y\xFCkler.",
      captureWait: "X'in takip listesi iste\u011Fi g\xF6ndermesi bekleniyor\u2026",
      domScanHint: "G\xF6r\xFCn\xFCr liste taran\u0131yor. Tak\u0131l\u0131rsa sayfay\u0131 kayd\u0131r.",
      scanningPage: "Sayfa {page}, {count} tarand\u0131",
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
      activityBlocked: "X aktivite taramas\u0131n\u0131 engelledi. Birka\xE7 saat bekleyip tekrar dene.",
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
      tabNonFollowers: "Takip etmeyenler",
      tabInactive: "Pasif hesaplar",
      activityKicker: "Aktivite denetimi",
      activityBody: "Takip etti\u011Fin hesaplardan son {days} g\xFCnde g\xF6nderi, retweet veya yan\u0131t payla\u015Fmayanlar\u0131 bul.",
      activityStart: "Aktivite taramas\u0131n\u0131 ba\u015Flat",
      activityScanning: "Aktivite kontrol ediliyor\u2026",
      activityHint: "Bu sekmeyi g\xF6r\xFCn\xFCr tut. \u0130stedi\u011Fin an duraklat\u0131p iptal edebilirsin.",
      activityProgress: "{checked} / {total} kontrol edildi",
      activityCurrent: "\u015Eu an: @{handle}",
      activityFound: "{count} pasif hesap",
      activityFoundOne: "1 pasif hesap",
      activityUnit: "pasif hesap",
      activityUnitOne: "pasif hesap",
      activityNone: "Bu aral\u0131kta pasif hesap yok",
      activityLiveEmpty: "Bulunan pasif hesaplar burada g\xF6r\xFCnecek.",
      activityNever: "Hi\xE7 g\xF6nderi yok",
      activityLastPost: "Son g\xF6nderi: {time}",
      activityLastCheck: "Son kontrol: {time}",
      activityUnknown: "Kontrol edilemedi",
      activityUnknownCount: "{count} hesap kontrol edilemedi",
      activityReasonNoId: "Kimlik yok",
      activityReasonNotFound: "Bulunamad\u0131",
      activityReasonTemplate: "Sorgu ba\u015Far\u0131s\u0131z",
      activityReasonProtected: "Korumal\u0131",
      activityReasonRate: "H\u0131z limiti",
      activityReasonUnavailable: "Eri\u015Filemedi",
      activityFresh: "Aktivite verileri g\xFCncel",
      activityNeedsScan: "\xD6nce takip listeni tara",
      activityPartial: "{count} hesap kontrol edildi. Tamamlamak i\xE7in devam et.",
      activityClear: "Aktivite verilerini temizle",
      activityCleared: "Aktivite verileri temizlendi",
      activityClearTitle: "Aktivite verileri silinsin mi?",
      activityClearBody: "Son g\xF6nderi zamanlar\u0131 ve kontrol kay\u0131tlar\u0131 bu cihazdan silinir.",
      activityFallback: "Toplu kontrol kullan\u0131lamad\u0131; hesap ba\u015F\u0131na kontrole ge\xE7ildi",
      activityGraphqlHint: "X aktivite iste\u011Fini reddetti; sayfay\u0131 yenileyip tekrar dene",
      activityCacheWarning: "Aktivite cache'i kaydedilemedi; sayfa yenilenirse ilerleme kaybolur.",
      activityFollowsWarning: "Se\xE7ilen {count} hesap seni takip ediyor. Yine de takipten \xE7\u0131k\u0131ls\u0131n m\u0131?",
      activityUnfollowTitle: "{count} pasif hesaptan \xE7\u0131k\u0131ls\u0131n m\u0131?",
      activityUnfollowBody: "Bu i\u015Flem geri al\u0131namaz. Bu hesaplar seni takip ediyor olabilir.",
      activityDoneToast: "Aktivite taramas\u0131 bitti: {count} pasif hesap.",
      activityDays: "Pasif e\u015Fi\u011Fi (g\xFCn)",
      activitySourceBatch: "Toplu",
      activitySourceProfile: "Profil",
      pillInactive: "{count} pasif",
      pillActivity: "Aktivite taran\u0131yor",
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
  function isFresh(savedAt, ttl = TTL) {
    const stamp = Number(savedAt);
    return Number.isFinite(stamp) && Date.now() - stamp < ttl && stamp <= Date.now() + 6e4;
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
  function isFreshActivity(entry, now = Date.now()) {
    const checkedAt = Number(entry?.checkedAt);
    return Number.isFinite(checkedAt) && checkedAt <= now + 6e4 && now - checkedAt < ACTIVITY_TTL;
  }
  function freshActivityEntries(entries, now = Date.now()) {
    const fresh = {};
    for (const [key, entry] of Object.entries(entries || {})) {
      if (isFreshActivity(entry, now)) fresh[key] = entry;
    }
    return fresh;
  }
  function loadActivity(storage = defaultStorage(), viewerHandle = "") {
    const parsed = readJson(storage, ACTIVITY_KEY);
    if (!parsed || !parsed.entries || typeof parsed.entries !== "object") {
      return {};
    }
    if (!sameViewer(viewerHandle, parsed.viewerHandle)) return {};
    const fresh = freshActivityEntries(parsed.entries);
    const storedCount = Object.keys(parsed.entries).length;
    const freshCount = Object.keys(fresh).length;
    if (freshCount !== storedCount) {
      if (freshCount > 0) {
        writeJson(storage, ACTIVITY_KEY, {
          version: parsed.version ?? 1,
          viewerHandle: parsed.viewerHandle,
          savedAt: Date.now(),
          entries: fresh
        });
      } else {
        try {
          storage.removeItem(ACTIVITY_KEY);
        } catch {
        }
      }
    }
    return fresh;
  }
  function saveActivity(storage = defaultStorage(), viewerHandle = "", entries = {}) {
    if (!storage) return false;
    if (!viewerHandle) return false;
    const now = Date.now();
    return writeJson(storage, ACTIVITY_KEY, {
      version: 1,
      viewerHandle,
      savedAt: now,
      entries: freshActivityEntries(entries, now)
    });
  }
  function clearActivity(storage = defaultStorage()) {
    if (!storage) return false;
    try {
      storage.removeItem(ACTIVITY_KEY);
      return true;
    } catch {
      return false;
    }
  }
  function loadActivityScan(storage = defaultStorage(), viewerHandle = "") {
    const scan = readJson(storage, ACTIVITY_SCAN_KEY);
    if (!scan) return null;
    if (!sameViewer(viewerHandle, scan.viewerHandle)) return null;
    if (!isFresh(scan.savedAt, ACTIVITY_TTL)) {
      clearActivityScan(storage);
      return null;
    }
    return scan;
  }
  function saveActivityScan(storage = defaultStorage(), scan = {}) {
    if (!storage) return false;
    const next = { ...scan };
    if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
    return writeJson(storage, ACTIVITY_SCAN_KEY, next);
  }
  function clearActivityScan(storage = defaultStorage()) {
    if (!storage) return false;
    try {
      storage.removeItem(ACTIVITY_SCAN_KEY);
      return true;
    } catch {
      return false;
    }
  }

  // src/capture.js
  var capturedFollowing = null;
  var capturedActivity = null;
  var FOLLOWING_OPERATIONS = /* @__PURE__ */ new Set(["Following", "followingQuery"]);
  var ACTIVITY_OPERATIONS = /* @__PURE__ */ new Set(["UserTweetsAndReplies"]);
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
  function parseGraphqlTemplate(input, allowedOperations) {
    const absolute2 = absoluteUrl(input?.url);
    if (!absolute2) return null;
    let parsed;
    try {
      parsed = new URL(absolute2);
    } catch {
      return null;
    }
    const match = parsed.pathname.match(
      /^\/i\/api\/graphql\/([^/]+)\/([^/]+)\/?$/
    );
    if (!match) return null;
    const operationName = decodeURIComponent(match[2]);
    if (!allowedOperations.has(operationName)) return null;
    const queryId = decodeURIComponent(match[1]);
    const upperMethod = String(input?.method || "GET").toUpperCase();
    const bodyJson = parseBody(input?.body);
    let variables = {};
    let features = null;
    let fieldToggles = null;
    if (upperMethod === "GET") {
      variables = safeJsonParse(parsed.searchParams.get("variables"), {}) || {};
      features = safeJsonParse(parsed.searchParams.get("features"), null);
      fieldToggles = safeJsonParse(parsed.searchParams.get("fieldToggles"), null);
    } else {
      variables = bodyJson?.variables || {};
      features = bodyJson?.features ?? null;
      fieldToggles = bodyJson?.fieldToggles ?? null;
    }
    if (!variables || typeof variables !== "object") variables = {};
    return {
      url: absolute2,
      method: upperMethod,
      headers: pickHeaders(input?.headers),
      body: typeof input?.body === "string" ? input.body : bodyJson ? JSON.stringify(bodyJson) : "",
      variables,
      features,
      fieldToggles,
      queryId,
      operationName,
      capturedAt: Date.now(),
      responseSample: null
    };
  }
  function parseTemplate(input = {}) {
    return parseGraphqlTemplate(input, FOLLOWING_OPERATIONS);
  }
  function parseActivityTemplate(input = {}) {
    return parseGraphqlTemplate(input, ACTIVITY_OPERATIONS);
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
  function attachSample(response, template, readCurrent) {
    if (!response || typeof response.clone !== "function") return;
    try {
      const clone = response.clone();
      if (typeof clone.json !== "function") return;
      clone.json().then((json) => {
        const current = readCurrent();
        if (current && current.capturedAt === template.capturedAt) {
          current.responseSample = json;
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
        const following = parseTemplate(parts);
        const activity = parseActivityTemplate(parts);
        const promise = fetchImpl.apply(this, arguments);
        if (following) {
          capturedFollowing = following;
          Promise.resolve(promise).then(
            (response) => attachSample(response, following, () => capturedFollowing)
          ).catch(() => {
          });
        }
        if (activity) {
          capturedActivity = activity;
          Promise.resolve(promise).then(
            (response) => attachSample(response, activity, () => capturedActivity)
          ).catch(() => {
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
          const input = {
            url: meta.url,
            method: meta.method,
            headers: null,
            body
          };
          const following = parseTemplate(input);
          const activity = parseActivityTemplate(input);
          if (following) capturedFollowing = following;
          if (activity) capturedActivity = activity;
          if (following || activity) {
            this.addEventListener?.("load", () => {
              try {
                const json = safeJsonParse(this.responseText, null);
                if (json && following && capturedFollowing && capturedFollowing.capturedAt === following.capturedAt) {
                  capturedFollowing.responseSample = json;
                }
                if (json && activity && capturedActivity && capturedActivity.capturedAt === activity.capturedAt) {
                  capturedActivity.responseSample = json;
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
    capturedFollowing = null;
    capturedActivity = null;
  }
  function getCapturedFollowing() {
    return capturedFollowing;
  }
  function getCapturedActivity() {
    return capturedActivity;
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

  // src/activity.js
  var DAY = 24 * 60 * 60 * 1e3;
  function makeError2(kind, message, extra = {}) {
    const error = new Error(message || kind);
    error.kind = kind;
    Object.assign(error, extra);
    return error;
  }
  function parseTwitterDate(value) {
    if (value === null || value === void 0 || value === "") return null;
    const text = String(value).trim();
    if (/^\d+$/.test(text)) {
      const number = Number(text);
      if (!Number.isFinite(number) || number <= 0) return null;
      return number > 1e12 ? number : number * 1e3;
    }
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function classifyActivity(entry, days = ACTIVITY_DEFAULT_DAYS, now = Date.now()) {
    if (!entry || entry.state !== "known") return "unknown";
    const raw = entry.lastTweetAt;
    if (raw === null || raw === void 0 || raw === "") return "unknown";
    const stamp = Number(raw);
    if (!Number.isFinite(stamp) || stamp < 0) return "unknown";
    if (stamp === 0) return "inactive";
    const windowDays = clamp(
      Number(days) || ACTIVITY_DEFAULT_DAYS,
      ACTIVITY_MIN_DAYS,
      ACTIVITY_MAX_DAYS
    );
    return stamp <= now - windowDays * DAY ? "inactive" : "active";
  }
  function isActivityFresh(entry, now = Date.now()) {
    const checkedAt = Number(entry?.checkedAt);
    return Number.isFinite(checkedAt) && checkedAt <= now + 6e4 && now - checkedAt < ACTIVITY_TTL;
  }
  function activityEntryFor(entries, user) {
    const store = entries && typeof entries === "object" ? entries : {};
    const id = String(user?.id || "");
    const handle = String(user?.handle || "").toLowerCase();
    if (id && Object.hasOwn(store, id)) return store[id];
    if (handle && Object.hasOwn(store, handle)) return store[handle];
    return null;
  }
  function normalizeLookupItem(raw) {
    const id = String(raw?.id_str || raw?.id || "").trim();
    const handle = String(raw?.screen_name || raw?.handle || "").replace(/^@/, "").trim();
    if (!id && !handle) return null;
    const rawCount = raw?.statuses_count;
    const parsedCount = rawCount === null || rawCount === void 0 || rawCount === "" ? null : Number(rawCount);
    const count = Number.isFinite(parsedCount) ? parsedCount : null;
    const createdAt = raw?.status?.created_at;
    let state = "fallback";
    let lastTweetAt = null;
    if (createdAt !== void 0 && createdAt !== null && createdAt !== "") {
      const parsed = parseTwitterDate(createdAt);
      if (parsed !== null) {
        state = "known";
        lastTweetAt = parsed;
      }
    } else if (count === 0) {
      state = "known";
      lastTweetAt = 0;
    }
    return { id, handle, state, lastTweetAt, statusesCount: count, reason: "" };
  }
  function parseLookupUsers(json) {
    const list = Array.isArray(json) ? json : Array.isArray(json?.users) ? json.users : [];
    const byId = /* @__PURE__ */ new Map();
    const byHandle = /* @__PURE__ */ new Map();
    const items = /* @__PURE__ */ new Map();
    for (const raw of list) {
      const item = normalizeLookupItem(raw);
      if (!item) continue;
      const key = item.id || item.handle.toLowerCase();
      items.set(key, item);
      if (item.id) byId.set(item.id, item);
      if (item.handle) byHandle.set(item.handle.toLowerCase(), item);
    }
    return { items: [...items.values()], byId, byHandle };
  }
  function findInstructions2(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 20) return null;
    if (Array.isArray(node.instructions)) return node.instructions;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = findInstructions2(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const value of Object.values(node)) {
      const found = findInstructions2(value, depth + 1);
      if (found) return found;
    }
    return null;
  }
  function collectEntries(node, out, depth = 0) {
    if (!node || typeof node !== "object" || depth > 30) return;
    if (node.entry && typeof node.entry === "object") out.push(node.entry);
    if (Array.isArray(node.entries)) out.push(...node.entries);
    if (Array.isArray(node.items)) out.push(...node.items);
    if (Array.isArray(node.moduleItems)) out.push(...node.moduleItems);
    for (const value of Object.values(node)) collectEntries(value, out, depth + 1);
  }
  function isCursorEntry(entry) {
    const content = entry?.content || entry?.item?.itemContent || entry?.itemContent || {};
    const contentType = content?.__typename || content?.entryType || "";
    return Boolean(content?.cursorType) || contentType === "TimelineTimelineCursor" || content?.itemContent?.__typename === "TimelineTimelineCursor" || String(entry?.entryId || "").toLowerCase().includes("cursor");
  }
  function tweetResultOf(entry) {
    const content = entry?.content || entry?.item?.itemContent || entry?.itemContent || {};
    return content?.itemContent?.tweet_results?.result || content?.tweet_results?.result || entry?.item?.itemContent?.tweet_results?.result || null;
  }
  function tweetTimestamp(result, userId) {
    const tweet = result?.__typename === "TweetWithVisibilityResults" ? result.tweet : result;
    if (!tweet || tweet.__typename === "TweetUnavailable") {
      return { relevant: false, at: null };
    }
    const legacy = tweet.legacy || {};
    const authorId = String(tweet.core?.user_results?.result?.rest_id || "");
    const relevant = !userId || authorId === String(userId);
    if (!relevant) return { relevant: false, at: null };
    return { relevant: true, at: parseTwitterDate(legacy.created_at) };
  }
  function parseUserTweetsPage(json, userId = "") {
    const message = String(json?.errors?.[0]?.message || "");
    if (/rate limit|too many requests/i.test(message)) {
      return { state: "unknown", reason: message, fatalKind: "rate" };
    }
    if (/could not find user|user not found|suspended|not authorized to view/i.test(message)) {
      return { state: "unknown", reason: "unavailable" };
    }
    if (/could not authenticate|unauthorized|require_login|authentication/i.test(message)) {
      return { state: "unknown", reason: message, fatalKind: "auth" };
    }
    if (/blocked|forbidden|challenge/i.test(message)) {
      return { state: "unknown", reason: message, fatalKind: "blocked" };
    }
    const root = json?.data?.user?.result || json?.data?.user;
    if (!root) {
      if (message) {
        if (/query|queryid|variable|invalid|bad request|unsupported|operation/i.test(
          message
        )) {
          return { state: "unknown", reason: message, fatalKind: "template" };
        }
        return { state: "unknown", reason: message };
      }
      return { state: "unknown", reason: "not-found" };
    }
    if (root.__typename === "UserUnavailable") {
      return { state: "unknown", reason: "unavailable" };
    }
    const instructions = findInstructions2(root);
    if (!instructions) return { state: "unknown", reason: "parse" };
    const entries = [];
    collectEntries(instructions, entries);
    let recognized = 0;
    let relevant = 0;
    let lastTweetAt = 0;
    let nonCursor = 0;
    for (const entry of entries) {
      if (isCursorEntry(entry)) continue;
      nonCursor += 1;
      const result = tweetResultOf(entry);
      if (!result) continue;
      recognized += 1;
      const info = tweetTimestamp(result, userId);
      if (!info.relevant) continue;
      relevant += 1;
      if (info.at !== null && info.at > lastTweetAt) lastTweetAt = info.at;
    }
    if (recognized === 0 && nonCursor > 0) {
      return { state: "unknown", reason: "parse" };
    }
    if (recognized > 0 && relevant === 0) {
      return { state: "unknown", reason: "parse" };
    }
    if (relevant > 0 && lastTweetAt === 0) {
      return { state: "unknown", reason: "parse" };
    }
    return { state: "known", lastTweetAt, reason: "" };
  }
  function originOf2(origin) {
    return origin || typeof location !== "undefined" && location.origin || "https://x.com";
  }
  function authHeaders3(csrf, isJson, transactionId) {
    const headers = {
      authorization: `Bearer ${BEARER}`,
      "x-csrf-token": csrf || "",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en"
    };
    if (isJson) headers["content-type"] = "application/json";
    if (transactionId) headers["x-client-transaction-id"] = transactionId;
    return headers;
  }
  function normalizeSelector(values, handles = false) {
    if (!Array.isArray(values)) return [];
    return values.map((value) => value === null || value === void 0 ? "" : String(value)).map((value) => value.trim()).map((value) => handles ? value.replace(/^@/, "") : value).filter(Boolean);
  }
  function buildLookupRequest({
    userIds = [],
    screenNames = [],
    csrf = "",
    origin = "",
    transactionId = ""
  } = {}) {
    const ids = normalizeSelector(userIds);
    const names = normalizeSelector(screenNames, true);
    if (!ids.length && !names.length) {
      throw makeError2("format", "lookup requires user_id or screen_name");
    }
    if (ids.length && names.length) {
      throw makeError2("format", "lookup accepts one selector type");
    }
    const url = new URL("/i/api/1.1/users/lookup.json", originOf2(origin));
    if (ids.length) url.searchParams.set("user_id", ids.join(","));
    if (names.length) url.searchParams.set("screen_name", names.join(","));
    url.searchParams.set("include_entities", "true");
    return {
      url: url.toString(),
      init: {
        method: "GET",
        headers: authHeaders3(csrf, false, transactionId),
        credentials: "include"
      }
    };
  }
  function buildShowUserRequest({
    userId = "",
    screenName = "",
    csrf = "",
    origin = "",
    transactionId = ""
  } = {}) {
    const id = String(userId || "").trim();
    const handle = String(screenName || "").trim().replace(/^@/, "");
    if (!id && !handle) {
      throw makeError2("format", "show requires user_id or screen_name");
    }
    const url = new URL("/i/api/1.1/users/show.json", originOf2(origin));
    if (id) url.searchParams.set("user_id", id);
    else url.searchParams.set("screen_name", handle);
    url.searchParams.set("include_entities", "true");
    url.searchParams.set("tweet_mode", "extended");
    return {
      url: url.toString(),
      init: {
        method: "GET",
        headers: authHeaders3(csrf, false, transactionId),
        credentials: "include"
      }
    };
  }
  function parseShowUser(json) {
    const raw = Array.isArray(json) ? json[0] : json?.user || json;
    if (!raw || typeof raw !== "object") return null;
    return parseLookupUsers([raw]).items[0] || null;
  }
  function buildActivityRequest(template, { userId = "", count = 20, csrf = "", origin = "", transactionId = "" } = {}) {
    if (!template) throw makeError2("format", "No activity template");
    const method = String(template.method || "GET").toUpperCase() === "POST" ? "POST" : "GET";
    const variables = { ...template.variables || {} };
    variables.userId = String(userId || "");
    variables.count = Number(count) || 20;
    variables.includePromotedContent = false;
    variables.withCommunity = true;
    variables.withVoice = true;
    variables.withV2Timeline = true;
    delete variables.cursor;
    const transaction = transactionId || template.headers?.["x-client-transaction-id"] || "";
    const headers = authHeaders3(csrf, method === "POST", transaction);
    if (method === "GET") {
      const url = new URL(template.url, originOf2(origin));
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
        init: { method: "GET", headers, credentials: "include" }
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
      url: new URL(template.url, originOf2(origin)).toString(),
      init: {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
      }
    };
  }
  function buildDefaultActivityTemplate(queryId = ACTIVITY_QUERY_ID) {
    const variables = {
      userId: "",
      count: 20,
      includePromotedContent: false,
      withCommunity: true,
      withVoice: true,
      withV2Timeline: true
    };
    return {
      url: `https://x.com/i/api/graphql/${queryId}/UserTweetsAndReplies`,
      method: "GET",
      headers: {},
      body: "",
      variables,
      features: ACTIVITY_FEATURES,
      fieldToggles: { withArticlePlainText: false },
      queryId,
      operationName: "UserTweetsAndReplies",
      capturedAt: 0,
      responseSample: null
    };
  }
  function buildDefaultActivityTemplates() {
    return ACTIVITY_QUERY_IDS.map((id) => buildDefaultActivityTemplate(id));
  }
  function abortError() {
    return makeError2("aborted", "Aborted");
  }
  function isLookupUnsupported(error) {
    const status = Number(error?.status);
    if (error?.kind === "blocked" && status === 403) return true;
    if (error?.kind === "format" && !status && /lookup/i.test(error?.message || "")) {
      return true;
    }
    return error?.kind === "format" && [400, 404, 405, 410].includes(status);
  }
  function isUserLevelGraphqlError(error) {
    const message = String(
      error?.body?.errors?.[0]?.message || error?.message || ""
    );
    return /could not find user|user not found|suspended|not authorized to view|protected|user unavailable|account unavailable/i.test(
      message
    );
  }
  async function runActivityScan(options = {}) {
    const {
      users = [],
      cache = {},
      days = ACTIVITY_DEFAULT_DAYS,
      csrf = "",
      origin = "",
      template = null,
      templates = null,
      fetchImpl = globalThis.fetch,
      sleepFn = sleep,
      random = Math.random,
      timings = {},
      onResult = () => {
      },
      onProgress = () => {
      },
      shouldPause,
      shouldCancel,
      signal,
      lookup = true,
      force = false,
      transactionProvider = null
    } = options;
    const clock = typeof options.now === "function" ? options.now : () => {
      const raw = options.now;
      if (raw === null || raw === void 0 || String(raw).trim() === "") {
        return Date.now();
      }
      const value = Number(raw);
      return Number.isFinite(value) ? value : Date.now();
    };
    const scanTimings = { ...DEFAULT_TIMINGS, ...timings || {} };
    const delayMin = Math.max(0, Number(scanTimings.scanDelayMin) || 0);
    const delayMax = Math.max(delayMin, Number(scanTimings.scanDelayMax) || 0);
    const pauseEvery = Math.max(
      0,
      Number(scanTimings.scanPauseEveryPages) || 0
    );
    const pauseMs = Math.max(0, Number(scanTimings.scanPauseMs) || 0);
    const candidates = dedupeUsers(Array.isArray(users) ? users : []).filter(
      (user) => {
        if (!user || !user.handle) return false;
        if (force) return true;
        const cached = activityEntryFor(cache, user);
        if (cached?.reason === "template" || cached?.state === "unknown") {
          return true;
        }
        return !isActivityFresh(cached, clock());
      }
    );
    const total = candidates.length;
    let checked = 0;
    let inactive = 0;
    let unknown = 0;
    let requests = 0;
    let lookupMode = Boolean(lookup);
    let showMode = false;
    let currentSource = lookupMode ? "lookup" : "graphql";
    let graphqlBroken = false;
    const templateList = Array.isArray(templates) && templates.length ? templates : template ? [template] : buildDefaultActivityTemplates();
    let templateIndex = 0;
    const check = () => {
      if (signal?.aborted || shouldCancel?.()) throw abortError();
    };
    const transactionFor = async (method, path) => {
      if (typeof transactionProvider !== "function") return "";
      try {
        return await transactionProvider(method, path) || "";
      } catch {
        return "";
      }
    };
    const waitWhilePaused = async () => {
      while (shouldPause?.()) {
        check();
        onProgress({ kind: "paused", checked, total, source: currentSource });
        await sleepFn(250);
      }
      check();
    };
    const pace = async () => {
      if (requests > 0) {
        const wait = delayMax <= delayMin ? delayMin : delayMin + random() * (delayMax - delayMin);
        if (wait > 0) {
          onProgress({
            kind: "delay",
            ms: wait,
            checked,
            total,
            source: currentSource
          });
          await sleepFn(wait);
          if (shouldPause?.()) await waitWhilePaused();
          check();
        }
        if (pauseEvery > 0 && requests % pauseEvery === 0 && pauseMs > 0) {
          onProgress({
            kind: "pause",
            ms: pauseMs,
            checked,
            total,
            source: currentSource
          });
          await sleepFn(pauseMs);
          if (shouldPause?.()) await waitWhilePaused();
          check();
        }
      }
      requests += 1;
      check();
    };
    const processEntry = (user, entry) => {
      const originalState = entry.state;
      let state = originalState === "known" || originalState === "unknown" ? originalState : "unknown";
      let parseFailure = state === "unknown" && originalState !== "unknown";
      let lastTweetAt = null;
      if (state === "known") {
        const raw = entry.lastTweetAt;
        if (raw === null || raw === void 0 || String(raw).trim() === "") {
          state = "unknown";
          parseFailure = true;
        } else {
          const value = Number(raw);
          if (Number.isFinite(value) && value >= 0) lastTweetAt = value;
          else {
            state = "unknown";
            parseFailure = true;
          }
        }
      }
      const normalized = {
        id: String(entry.id || user.id || ""),
        handle: user.handle,
        state,
        lastTweetAt: state === "known" ? lastTweetAt : null,
        reason: entry.reason || (state === "unknown" && parseFailure ? "parse" : ""),
        checkedAt: clock(),
        source: entry.source || currentSource
      };
      checked += 1;
      if (normalized.state === "unknown") unknown += 1;
      else if (classifyActivity(normalized, days, clock()) === "inactive") {
        inactive += 1;
      }
      onResult(user, normalized);
      onProgress({
        kind: "result",
        user,
        entry: normalized,
        checked,
        total,
        inactive,
        unknown,
        source: normalized.source
      });
      if (checked % 5 === 0) {
        onProgress({
          kind: "checkpoint",
          checked,
          total,
          source: normalized.source
        });
      }
    };
    const advanceTemplate = () => {
      if (templateIndex < templateList.length - 1) {
        templateIndex += 1;
        onProgress({ kind: "template-retry", checked, total, source: currentSource });
        return true;
      }
      return false;
    };
    const breakGraphql = (user) => {
      graphqlBroken = true;
      processEntry(user, {
        state: "unknown",
        reason: "template",
        source: "graphql"
      });
      onProgress({
        kind: "template-broken",
        checked,
        total,
        source: currentSource
      });
    };
    const lookupBatch = async (batch) => {
      const ids = batch.filter((user) => user.id).map((user) => String(user.id));
      const names = batch.filter((user) => !user.id).map((user) => user.handle);
      let json;
      try {
        await pace();
        const transactionId = await transactionFor(
          "GET",
          "/i/api/1.1/users/lookup.json"
        );
        const request = buildLookupRequest({
          userIds: ids,
          screenNames: names,
          csrf,
          origin,
          transactionId
        });
        json = await fetchJson(request.url, request.init, {
          fetchImpl,
          signal,
          sleepFn
        });
      } catch (error) {
        if (isLookupUnsupported(error)) {
          throw makeError2("lookup-unsupported", "lookup unsupported", {
            cause: error,
            status: error.status
          });
        }
        throw error;
      }
      const parsed = parseLookupUsers(json);
      const fallback = [];
      let matched = 0;
      for (const user of batch) {
        const handleKey = String(user.handle || "").replace(/^@/, "").toLowerCase();
        const item = user.id && parsed.byId.get(String(user.id)) || parsed.byHandle.get(handleKey);
        if (!item) {
          fallback.push(user);
          continue;
        }
        matched += 1;
        if (!user.id && item.id) user.id = String(item.id);
        if (item.state === "known") {
          processEntry(user, { ...item, source: "lookup" });
        } else {
          fallback.push(user);
        }
      }
      if (batch.length > 0 && matched === 0) {
        throw makeError2("lookup-unsupported", "lookup returned no users");
      }
      return fallback;
    };
    const graphqlUser = async (user) => {
      if (graphqlBroken) {
        processEntry(user, {
          state: "unknown",
          reason: "template",
          source: "graphql"
        });
        return;
      }
      if (!user.id) {
        processEntry(user, { state: "unknown", reason: "no-id", source: "graphql" });
        return;
      }
      while (true) {
        let request;
        const template2 = templateList[templateIndex];
        const method = String(template2?.method || "GET").toUpperCase() === "POST" ? "POST" : "GET";
        let path = "/";
        try {
          path = new URL(template2.url, originOf2(origin)).pathname;
        } catch {
        }
        try {
          await pace();
          const transactionId = await transactionFor(method, path);
          request = buildActivityRequest(template2, {
            userId: user.id,
            count: 20,
            csrf,
            origin,
            transactionId
          });
        } catch (error) {
          if (error.kind === "format") {
            if (advanceTemplate()) continue;
            breakGraphql(user);
            return;
          }
          throw error;
        }
        let json;
        try {
          json = await fetchJson(request.url, request.init, {
            fetchImpl,
            signal,
            sleepFn
          });
        } catch (error) {
          if (error.kind !== "rate" && isUserLevelGraphqlError(error)) {
            processEntry(user, {
              state: "unknown",
              reason: "unavailable",
              source: "graphql"
            });
            return;
          }
          if (error.kind === "format" && [400, 404, 405, 410].includes(Number(error.status))) {
            if (advanceTemplate()) continue;
            breakGraphql(user);
            return;
          }
          throw error;
        }
        const parsed = parseUserTweetsPage(json, user.id);
        if (parsed.fatalKind === "template") {
          if (advanceTemplate()) continue;
          breakGraphql(user);
          return;
        }
        if (parsed.fatalKind) {
          throw makeError2(parsed.fatalKind, parsed.reason || parsed.fatalKind, {
            status: 200,
            body: json,
            retryAfter: 0
          });
        }
        processEntry(user, { ...parsed, source: "graphql" });
        return;
      }
    };
    const switchToGraphql = async (user, reason) => {
      showMode = false;
      currentSource = "graphql";
      onProgress({
        kind: "fallback",
        to: "graphql",
        reason,
        checked,
        total
      });
      await graphqlUser(user);
    };
    const showUser = async (user) => {
      if (!showMode) {
        await graphqlUser(user);
        return;
      }
      let request;
      try {
        await pace();
        const transactionId = await transactionFor(
          "GET",
          "/i/api/1.1/users/show.json"
        );
        request = user.id ? buildShowUserRequest({ userId: user.id, csrf, origin, transactionId }) : buildShowUserRequest({
          screenName: user.handle,
          csrf,
          origin,
          transactionId
        });
      } catch (error) {
        if (error.kind !== "format") throw error;
        await switchToGraphql(user, error.message);
        return;
      }
      let json;
      try {
        json = await fetchJson(request.url, request.init, {
          fetchImpl,
          signal,
          sleepFn
        });
      } catch (error) {
        const status = Number(error?.status);
        const userLevel = error.kind !== "rate" && isUserLevelGraphqlError(error);
        if (userLevel && (status === 403 || status === 404)) {
          processEntry(user, {
            state: "unknown",
            reason: "unavailable",
            source: "show"
          });
          return;
        }
        if (isLookupUnsupported(error)) {
          await switchToGraphql(user, error.message);
          return;
        }
        if (userLevel) {
          processEntry(user, {
            state: "unknown",
            reason: "unavailable",
            source: "show"
          });
          return;
        }
        throw error;
      }
      const item = parseShowUser(json);
      if (!item) {
        await switchToGraphql(user, "invalid show response");
        return;
      }
      if (!user.id && item.id) user.id = String(item.id);
      if (item.state === "known") {
        processEntry(user, { ...item, source: "show" });
        return;
      }
      await graphqlUser(user);
    };
    onProgress({ kind: "start", total, source: currentSource });
    if (!total) {
      onProgress({
        kind: "done",
        checked: 0,
        inactive: 0,
        unknown: 0,
        total: 0,
        source: currentSource,
        stopped: graphqlBroken ? "template" : "done"
      });
      return {
        checked,
        inactive,
        unknown,
        total,
        source: currentSource,
        stopped: graphqlBroken ? "template" : "done"
      };
    }
    const idQueue = candidates.filter((user) => user.id);
    const handleQueue = candidates.filter((user) => !user.id);
    let idIndex = 0;
    let handleIndex = 0;
    const hasRemaining = () => idIndex < idQueue.length || handleIndex < handleQueue.length;
    const takeBatch = () => {
      if (idIndex < idQueue.length) {
        const batch2 = idQueue.slice(idIndex, idIndex + ACTIVITY_BATCH_SIZE);
        idIndex += batch2.length;
        return batch2;
      }
      const batch = handleQueue.slice(handleIndex, handleIndex + ACTIVITY_BATCH_SIZE);
      handleIndex += batch.length;
      return batch;
    };
    const takeOne = () => {
      if (idIndex < idQueue.length) return idQueue[idIndex++];
      return handleQueue[handleIndex++];
    };
    while (hasRemaining()) {
      await waitWhilePaused();
      if (lookupMode) {
        const batch = takeBatch();
        let fallback;
        try {
          fallback = await lookupBatch(batch);
        } catch (error) {
          if (error.kind === "lookup-unsupported") {
            lookupMode = false;
            showMode = true;
            currentSource = "show";
            onProgress({
              kind: "fallback",
              to: "show",
              reason: error.message,
              checked,
              total
            });
            for (const user of batch) {
              await waitWhilePaused();
              await showUser(user);
            }
            continue;
          }
          throw error;
        }
        for (const user of fallback) {
          await waitWhilePaused();
          await graphqlUser(user);
        }
      } else if (showMode) {
        const user = takeOne();
        await waitWhilePaused();
        await showUser(user);
      } else {
        const user = takeOne();
        await waitWhilePaused();
        await graphqlUser(user);
      }
    }
    onProgress({
      kind: "done",
      checked,
      inactive,
      unknown,
      total,
      source: currentSource,
      stopped: graphqlBroken ? "template" : "done"
    });
    return {
      checked,
      inactive,
      unknown,
      total,
      source: currentSource,
      stopped: graphqlBroken ? "template" : "done"
    };
  }

  // src/ui.js
  var LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
  var CSS = `
#${APP_ID}, #${APP_ID} * { box-sizing: border-box; }
#${APP_ID} {
  --ux-bg: #000;
  --ux-surface: #000;
  --ux-line: #4d4d4d;
  --ux-line-soft: #2a2a2a;
  --ux-text: #fff;
  --ux-muted: #b0b0b0;
  --ux-faint: #8a8a8a;
  --ux-primary-bg: #fff;
  --ux-primary-text: #000;
  --ux-hover: rgba(255,255,255,.06);
  --ux-selected: rgba(255,255,255,.10);
  --ux-ok: #35d07f;
  --ux-danger: #ff5a4f;
  --ux-warn: #e0a23c;
  --ux-shadow: 0 18px 44px rgba(0,0,0,.65);
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: transparent;
  color: var(--ux-text);
  font-family: "TwitterChirp", "Chirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.35;
  color-scheme: dark;
  font-variant-numeric: tabular-nums;
}
#${APP_ID}[data-theme="light"] {
  --ux-bg: #fff;
  --ux-surface: #fff;
  --ux-line: #949494;
  --ux-line-soft: #e6e6e6;
  --ux-text: #000;
  --ux-muted: #555;
  --ux-faint: #6f6f6f;
  --ux-primary-bg: #000;
  --ux-primary-text: #fff;
  --ux-hover: #f4f4f4;
  --ux-selected: #ededed;
  --ux-ok: #0b7a4a;
  --ux-danger: #c6281d;
  --ux-warn: #8a5200;
  --ux-shadow: 0 18px 44px rgba(0,0,0,.14);
  color-scheme: light;
}
#${APP_ID}[data-high-contrast="true"] {
  --ux-line: var(--ux-text);
  --ux-line-soft: var(--ux-text);
  --ux-muted: var(--ux-text);
  --ux-faint: var(--ux-text);
}
#${APP_ID} .ux-panel, #${APP_ID} .ux-pill, #${APP_ID} .ux-overlay, #${APP_ID} .ux-toast { pointer-events: auto; }
#${APP_ID} button, #${APP_ID} input, #${APP_ID} select, #${APP_ID} textarea { font: inherit; color: inherit; }
#${APP_ID} button { border: 0; background: none; cursor: pointer; }
#${APP_ID} a { color: inherit; text-decoration: none; }
#${APP_ID} svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; display: block; }
#${APP_ID} .ux-panel {
  position: absolute;
  top: ${PANEL.top}px;
  right: ${PANEL.right}px;
  width: ${PANEL.width}px;
  max-width: calc(100vw - ${PANEL.margin * 2}px);
  max-height: min(760px, calc(100vh - ${PANEL.top + PANEL.margin}px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ux-surface);
  border: 1px solid var(--ux-line);
  border-radius: 8px;
  box-shadow: var(--ux-shadow);
  animation: ux-in 120ms ease-out;
}
@keyframes ux-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--ux-line);
  cursor: grab;
  user-select: none;
}
#${APP_ID} .ux-head:active { cursor: grabbing; }
#${APP_ID} .ux-head button, #${APP_ID} .ux-head a { cursor: pointer; }
#${APP_ID} .ux-grip {
  width: 16px; height: 24px; padding: 0;
  display: grid; grid-template-columns: repeat(2, 2px); gap: 2px;
  align-content: center; justify-content: center;
  color: var(--ux-faint); cursor: grab; flex: none;
}
#${APP_ID} .ux-grip i { width: 2px; height: 2px; border-radius: 50%; background: currentColor; display: block; }
#${APP_ID} .ux-grip:hover { color: var(--ux-text); }
#${APP_ID} .ux-head .ux-grip { cursor: grab; }
#${APP_ID} .ux-grip:active { cursor: grabbing; }
#${APP_ID} .ux-brand { display: flex; align-items: center; gap: 7px; min-width: 0; flex: 1; }
#${APP_ID} .ux-mark {
  position: relative;
  width: 24px; height: 24px;
  border: 1px solid var(--ux-text);
  display: grid; place-items: center;
  font-size: 11px; font-weight: 800; line-height: 1;
  flex: none;
}
#${APP_ID} .ux-mark::after {
  content: "";
  position: absolute; left: 3px; right: 3px; top: 50%;
  height: 1px; background: var(--ux-text);
}
#${APP_ID} .ux-brand-text { display: flex; flex-direction: column; min-width: 0; }
#${APP_ID} .ux-brand-text strong {
  font-size: 11px; font-weight: 800; letter-spacing: .04em;
  text-transform: uppercase; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
#${APP_ID} .ux-brand-text span {
  font-size: 9.5px; color: var(--ux-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#${APP_ID} .ux-head-actions { display: flex; align-items: center; gap: 1px; flex: none; }
#${APP_ID} .ux-icon-btn {
  width: 26px; height: 26px; border-radius: 4px;
  display: inline-grid; place-items: center;
  color: var(--ux-muted);
}
#${APP_ID} .ux-icon-btn:hover { background: var(--ux-hover); color: var(--ux-text); }
#${APP_ID} .ux-lang {
  height: 24px; min-width: 30px; padding: 0 6px;
  border: 1px solid var(--ux-line); border-radius: 3px;
  font-size: 9.5px; font-weight: 700; color: var(--ux-muted);
}
#${APP_ID} .ux-lang:hover { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-body { overflow: auto; overscroll-behavior: contain; }
#${APP_ID} .ux-body::-webkit-scrollbar { width: 8px; }
#${APP_ID} .ux-body::-webkit-scrollbar-thumb {
  background: var(--ux-line); border-radius: 99px;
  border: 2px solid var(--ux-surface); background-clip: padding-box;
}
#${APP_ID} .ux-view { padding: 12px; }
#${APP_ID} .ux-eyebrow {
  display: block; font-size: 10px; font-weight: 600;
  color: var(--ux-muted); letter-spacing: 0; text-transform: none;
}
#${APP_ID} h1 { font-size: 22px; line-height: 1.1; letter-spacing: -.04em; margin: 4px 0 6px; font-weight: 800; }
#${APP_ID} h2 { font-size: 17px; line-height: 1.15; letter-spacing: -.02em; margin: 0; font-weight: 800; }
#${APP_ID} h3 { margin: 0; font-size: 15px; letter-spacing: -.02em; }
#${APP_ID} p { margin: 0; }
#${APP_ID} .ux-muted { color: var(--ux-muted); }
#${APP_ID} .ux-hero p { color: var(--ux-muted); font-size: 12px; line-height: 1.5; margin-top: 4px; }
#${APP_ID} .ux-hero-count { display: flex; align-items: baseline; gap: 7px; margin-top: 2px; }
#${APP_ID} .ux-hero-count strong {
  font-size: 36px; line-height: 1; letter-spacing: -.06em;
  font-weight: 800; font-variant-numeric: tabular-nums;
}
#${APP_ID} .ux-hero-count span { font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-subline {
  display: flex; flex-wrap: wrap; gap: 6px 12px;
  margin-top: 8px; padding: 6px 0;
  border-top: 1px solid var(--ux-line-soft);
  border-bottom: 1px solid var(--ux-line-soft);
  font-size: 10px; color: var(--ux-muted);
}
#${APP_ID} .ux-subline b { color: var(--ux-text); }
#${APP_ID} .ux-card {
  margin-top: 10px; padding: 10px 0;
  border-top: 1px solid var(--ux-line);
  border-bottom: 1px solid var(--ux-line);
  border-radius: 0; background: transparent;
}
#${APP_ID} .ux-card-line { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; font-size: 11px; color: var(--ux-muted); }
#${APP_ID} .ux-card-line strong { color: var(--ux-text); font-size: 12px; }
#${APP_ID} .ux-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-live-dot.is-paused { background: var(--ux-warn); }
#${APP_ID} .ux-btn {
  min-height: 32px; padding: 0 11px;
  border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  font-size: 11.5px; font-weight: 700; letter-spacing: -.01em;
  border: 1px solid transparent;
  transition: background 90ms ease, border-color 90ms ease, opacity 90ms ease;
}
#${APP_ID} .ux-btn:active { transform: translateY(1px); }
#${APP_ID} .ux-btn:disabled { opacity: .42; cursor: not-allowed; }
#${APP_ID} .ux-btn-block { width: 100%; }
#${APP_ID} .ux-btn-primary { background: var(--ux-primary-bg); color: var(--ux-primary-text); }
#${APP_ID} .ux-btn-primary:hover:not(:disabled) { opacity: .84; }
#${APP_ID} .ux-btn-soft { border-color: var(--ux-line); color: var(--ux-text); background: transparent; }
#${APP_ID} .ux-btn-soft:hover:not(:disabled) { background: var(--ux-hover); }
#${APP_ID} .ux-btn-danger { border-color: var(--ux-danger); color: var(--ux-danger); background: transparent; }
#${APP_ID} .ux-btn-danger:hover:not(:disabled) { background: var(--ux-hover); }
#${APP_ID} .ux-btn-ghost { color: var(--ux-muted); }
#${APP_ID} .ux-btn-ghost:hover:not(:disabled) { color: var(--ux-text); background: var(--ux-hover); }
#${APP_ID} .ux-stack { display: grid; gap: 6px; margin-top: 10px; }
#${APP_ID} .ux-stack .ux-btn { justify-content: space-between; }
#${APP_ID} .ux-safety {
  display: flex; gap: 7px; align-items: flex-start;
  margin-top: 12px; padding: 7px 0 7px 9px;
  border-left: 2px solid var(--ux-ok);
  color: var(--ux-muted); font-size: 11px; line-height: 1.45;
}
#${APP_ID} .ux-safety svg { width: 14px; height: 14px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-scan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
#${APP_ID} .ux-source-badge {
  font-size: 9px; font-weight: 700; color: var(--ux-muted);
  border: 1px solid var(--ux-line); border-radius: 2px; padding: 3px 5px;
  white-space: nowrap;
}
#${APP_ID} .ux-bar { height: 3px; border-radius: 0; background: var(--ux-line-soft); overflow: hidden; }
#${APP_ID} .ux-bar i { display: block; height: 100%; width: 0%; background: var(--ux-text); transition: width 180ms ease; }
#${APP_ID} .ux-bar.is-indeterminate i { width: 38% !important; animation: ux-indeterminate 1.15s ease-in-out infinite; }
@keyframes ux-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(280%); } }
#${APP_ID} .ux-scan-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 6px; font-size: 10px; color: var(--ux-muted); }
#${APP_ID} .ux-hint { margin-top: 10px; font-size: 11px; line-height: 1.5; color: var(--ux-muted); }
#${APP_ID} .ux-live-list { display: grid; margin-top: 10px; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-mini-row { display: flex; align-items: center; gap: 8px; padding: 6px 2px; border-bottom: 1px solid var(--ux-line-soft); border-radius: 0; background: transparent; }
#${APP_ID} .ux-mini-row .ux-avatar { width: 26px; height: 26px; font-size: 10px; }
#${APP_ID} .ux-mini-user { min-width: 0; display: flex; flex-direction: column; }
#${APP_ID} .ux-mini-user strong { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-mini-user span { font-size: 9.5px; color: var(--ux-muted); }
#${APP_ID} .ux-actions { display: flex; gap: 7px; margin-top: 12px; }
#${APP_ID} .ux-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
#${APP_ID} .ux-results-links { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex: none; }
#${APP_ID} .ux-link { color: var(--ux-text); font-size: 10.5px; font-weight: 600; padding: 3px 0; white-space: nowrap; text-decoration: underline; text-underline-offset: 2px; }
#${APP_ID} .ux-link:hover { text-decoration-thickness: 2px; }
#${APP_ID} .ux-link:disabled { opacity: .42; cursor: not-allowed; text-decoration: none; }
#${APP_ID} .ux-warning {
  display: flex; gap: 7px; align-items: flex-start;
  margin-top: 10px; padding: 7px 0 7px 9px;
  border-left: 2px solid var(--ux-warn);
  color: var(--ux-text); font-size: 11px; line-height: 1.45;
}
#${APP_ID} .ux-warning svg { width: 14px; height: 14px; flex: none; margin-top: 1px; color: var(--ux-warn); }
#${APP_ID} .ux-search {
  display: flex; align-items: center; gap: 7px;
  margin-top: 10px; padding: 0 9px; height: 32px;
  border: 1px solid var(--ux-line); border-radius: 3px;
  background: transparent;
}
#${APP_ID} .ux-search:focus-within { border-color: var(--ux-text); }
#${APP_ID} .ux-search svg { width: 14px; height: 14px; color: var(--ux-muted); flex: none; }
#${APP_ID} .ux-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 11.5px; }
#${APP_ID} .ux-search input::placeholder { color: var(--ux-faint); }
#${APP_ID} .ux-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
#${APP_ID} .ux-chip {
  height: 25px; padding: 0 8px; border-radius: 3px;
  border: 1px solid var(--ux-line); color: var(--ux-muted);
  font-size: 9.5px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 5px;
}
#${APP_ID} .ux-chip:hover { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-chip.is-on { background: var(--ux-primary-bg); border-color: var(--ux-primary-bg); color: var(--ux-primary-text); }
#${APP_ID} .ux-chip .ux-chip-count { font-size: 9px; opacity: .7; }
#${APP_ID} .ux-list { display: grid; margin-top: 8px; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-row {
  display: grid; grid-template-columns: 16px 28px minmax(0, 1fr) auto;
  align-items: center; gap: 8px;
  padding: 7px 2px;
  border-bottom: 1px solid var(--ux-line-soft);
  border-radius: 0;
}
#${APP_ID} .ux-row:hover { background: var(--ux-hover); }
#${APP_ID} .ux-row.is-selected { background: var(--ux-selected); }
#${APP_ID} .ux-row.is-hidden { opacity: .55; }
#${APP_ID} .ux-row input[type="checkbox"], #${APP_ID} .ux-check input[type="checkbox"] {
  width: 14px; height: 14px; accent-color: var(--ux-text); cursor: pointer;
}
#${APP_ID} .ux-check { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--ux-muted); cursor: pointer; }
#${APP_ID} .ux-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  object-fit: cover; display: grid; place-items: center; flex: none;
  background: transparent; border: 1px solid var(--ux-line);
}
#${APP_ID} .ux-avatar-fallback { font-size: 11px; font-weight: 800; color: var(--ux-text); background: transparent; }
#${APP_ID} .ux-user { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-user a { min-width: 0; }
#${APP_ID} .ux-user strong { display: block; font-size: 11.5px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-user > span { display: block; font-size: 10px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-badges { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
#${APP_ID} .ux-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 8.5px; font-weight: 600; border-radius: 2px;
  padding: 1px 4px; color: var(--ux-muted);
  border: 1px solid var(--ux-line); background: transparent;
}
#${APP_ID} .ux-badge svg { width: 10px; height: 10px; }
#${APP_ID} .ux-badge-blue { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-badge-warn { color: var(--ux-warn); border-color: var(--ux-warn); }
#${APP_ID} .ux-badge-muted { color: var(--ux-faint); }
#${APP_ID} .ux-row-actions { display: flex; align-items: center; gap: 1px; opacity: .65; }
#${APP_ID} .ux-row:hover .ux-row-actions { opacity: 1; }
#${APP_ID} .ux-row-actions .ux-icon-btn { width: 24px; height: 24px; }
#${APP_ID} .ux-row-actions svg { width: 13px; height: 13px; }
#${APP_ID} .ux-tabs {
  display: flex; gap: 4px; margin: 0 0 14px;
  border-bottom: 1px solid var(--ux-line-soft);
}
#${APP_ID} .ux-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-bottom: 2px solid transparent; background: transparent;
  color: var(--ux-muted); font: inherit; font-size: 11px; padding: 8px 4px;
  cursor: pointer;
}
#${APP_ID} .ux-tab.is-active { color: var(--ux-text); border-bottom-color: var(--ux-text); }
#${APP_ID} .ux-tab-count { font-size: 10px; color: var(--ux-muted); }
#${APP_ID} .ux-tab.is-active .ux-tab-count { color: var(--ux-text); }
#${APP_ID} .ux-row-note { color: var(--ux-muted); font-size: 10px; white-space: nowrap; }
#${APP_ID} .ux-row-spacer { width: 13px; }
#${APP_ID} .ux-row-muted { opacity: .78; }
#${APP_ID} .ux-unknown {
  margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ux-line-soft);
}
#${APP_ID} .ux-unknown summary {
  cursor: pointer; color: var(--ux-muted); font-size: 10.5px;
}
#${APP_ID} .ux-activity-intro { padding: 14px 0; }
#${APP_ID} .ux-activity-intro p {
  color: var(--ux-muted); font-size: 11.5px; line-height: 1.5; margin: 0 0 12px;
}
#${APP_ID} .ux-card-actions { display: flex; gap: 6px; margin-top: 10px; }
#${APP_ID} .ux-empty { padding: 22px 10px; text-align: center; color: var(--ux-muted); font-size: 11.5px; line-height: 1.5; }
#${APP_ID} .ux-empty strong { display: block; color: var(--ux-text); font-size: 12px; margin-bottom: 4px; }
#${APP_ID} .ux-actionbar {
  position: sticky; bottom: 0; z-index: 2;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin: 10px -12px -12px; padding: 9px 10px 10px;
  border-top: 1px solid var(--ux-line);
  background: var(--ux-surface);
}
#${APP_ID} .ux-actionbar .ux-spacer { flex: 1; }
#${APP_ID} .ux-actionbar .ux-btn { min-height: 30px; padding: 0 9px; font-size: 10.5px; }
#${APP_ID} .ux-actionbar .ux-link { padding: 0 2px; }
#${APP_ID} .ux-statline { display: flex; gap: 12px; margin: 10px 0 0; padding: 6px 0; border-top: 1px solid var(--ux-line); border-bottom: 1px solid var(--ux-line); }
#${APP_ID} .ux-stat { display: flex; align-items: baseline; gap: 4px; }
#${APP_ID} .ux-stat strong { font-size: 11px; font-weight: 800; }
#${APP_ID} .ux-stat span { font-size: 10px; color: var(--ux-muted); text-transform: none; letter-spacing: 0; }
#${APP_ID} .ux-current { margin-top: 10px; font-size: 12px; font-weight: 700; }
#${APP_ID} .ux-current span { color: var(--ux-text); }
#${APP_ID} .ux-next { margin-top: 2px; font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-log { display: grid; margin-top: 10px; max-height: 180px; overflow: auto; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-log-row { display: flex; align-items: center; gap: 7px; font-size: 10.5px; padding: 6px 2px; border-bottom: 1px solid var(--ux-line-soft); }
#${APP_ID} .ux-log-row .ux-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-log-row.is-fail .ux-dot { background: var(--ux-danger); }
#${APP_ID} .ux-log-row .ux-stamp { margin-left: auto; color: var(--ux-muted); border: 1px solid var(--ux-line); border-radius: 2px; padding: 1px 4px; font-size: 8px; }
#${APP_ID} .ux-strike { text-decoration: line-through; text-decoration-thickness: 1px; color: var(--ux-muted); }
#${APP_ID} .ux-done, #${APP_ID} .ux-error { text-align: center; padding: 22px 14px; }
#${APP_ID} .ux-done-icon, #${APP_ID} .ux-error-icon {
  width: 40px; height: 40px; border-radius: 0;
  margin: 0 auto 10px; display: grid; place-items: center;
  border: 1px solid var(--ux-ok); color: var(--ux-ok); background: transparent;
}
#${APP_ID} .ux-error-icon { border-color: var(--ux-warn); color: var(--ux-warn); }
#${APP_ID} .ux-done-icon svg, #${APP_ID} .ux-error-icon svg { width: 20px; height: 20px; }
#${APP_ID} .ux-done p, #${APP_ID} .ux-error p { color: var(--ux-muted); font-size: 11.5px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-done .ux-actions, #${APP_ID} .ux-error .ux-actions { margin-top: 14px; }
#${APP_ID} .ux-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 12px 7px; border-top: 1px solid var(--ux-line-soft);
  font-size: 9px; color: var(--ux-faint);
}
#${APP_ID} .ux-foot .ux-foot-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ux-ok); display: inline-block; margin-right: 4px; }
#${APP_ID} .ux-pill {
  position: absolute; top: ${PANEL.top}px; right: ${PANEL.right}px;
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 10px; border-radius: 8px;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  box-shadow: var(--ux-shadow);
  font-size: 11px; font-weight: 700; color: var(--ux-text);
}
#${APP_ID} .ux-pill:hover { border-color: var(--ux-text); }
#${APP_ID} .ux-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ux-muted); }
#${APP_ID} .ux-pill-dot.scanning, #${APP_ID} .ux-pill-dot.unfollowing { background: var(--ux-warn); }
#${APP_ID} .ux-pill svg { width: 12px; height: 12px; color: var(--ux-muted); }
#${APP_ID} .ux-overlay {
  position: fixed; inset: 0; z-index: 2;
  display: grid; place-items: center; padding: 20px;
  background: rgba(0,0,0,.55);
  animation: ux-fade 100ms ease-out;
}
#${APP_ID}[data-theme="light"] .ux-overlay { background: rgba(0,0,0,.38); }
@keyframes ux-fade { from { opacity: 0; } to { opacity: 1; } }
#${APP_ID} .ux-dialog {
  width: min(380px, 100%);
  max-height: calc(100vh - 40px); overflow: auto;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  border-radius: 8px; padding: 14px;
  box-shadow: var(--ux-shadow);
}
#${APP_ID} .ux-dialog > p { margin-top: 6px; color: var(--ux-muted); font-size: 11.5px; line-height: 1.55; }
#${APP_ID} .ux-dialog-content { margin-top: 10px; }
#${APP_ID} .ux-dialog-actions { display: flex; gap: 7px; margin-top: 14px; }
#${APP_ID} .ux-dialog-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-settings { display: grid; gap: 10px; }
#${APP_ID} .ux-settings-group { display: grid; gap: 6px; }
#${APP_ID} .ux-settings-title { font-size: 10px; font-weight: 700; color: var(--ux-muted); margin-bottom: 2px; text-transform: none; letter-spacing: 0; }
#${APP_ID} .ux-field { display: grid; grid-template-columns: 1fr 76px; align-items: center; gap: 8px; font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-field input { height: 28px; width: 100%; border-radius: 3px; border: 1px solid var(--ux-line); background: transparent; padding: 0 7px; font-size: 11px; outline: 0; }
#${APP_ID} .ux-field input:focus, #${APP_ID} .ux-input:focus { border-color: var(--ux-text); }
#${APP_ID} .ux-input { width: 100%; height: 32px; border-radius: 3px; border: 1px solid var(--ux-line); background: transparent; padding: 0 9px; outline: 0; }
#${APP_ID} .ux-toast {
  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
  z-index: 3; max-width: min(420px, calc(100vw - 28px));
  padding: 8px 12px; border-radius: 6px;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  box-shadow: var(--ux-shadow);
  font-size: 11px; color: var(--ux-text);
  animation: ux-toast-in 120ms ease-out;
}
@keyframes ux-toast-in { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
#${APP_ID} :focus-visible { outline: 2px solid var(--ux-text); outline-offset: 2px; }
#${APP_ID}[data-high-contrast="true"] :focus-visible { outline-width: 3px; }
@media (max-width: 560px) {
  #${APP_ID} .ux-panel { width: auto; left: 12px; right: 12px; max-width: none; }
  #${APP_ID} .ux-row { grid-template-columns: 16px 26px minmax(0, 1fr) auto; }
}
#${APP_ID}[data-reduce-motion="true"] *,
#${APP_ID}[data-reduce-motion="true"] *::before,
#${APP_ID}[data-reduce-motion="true"] *::after {
  animation-duration: .01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important;
  scroll-behavior: auto !important;
}
@media (prefers-reduced-motion: reduce) {
  #${APP_ID} *, #${APP_ID} *::before, #${APP_ID} *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
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
  function getActivityEntry(state, user) {
    return activityEntryFor(state.activityEntries || {}, user);
  }
  function activityStatus(state, user) {
    const entry = getActivityEntry(state, user);
    if (!entry || !isActivityFresh(entry)) return "unchecked";
    return classifyActivity(
      entry,
      state.activityDays ?? ACTIVITY_DEFAULT_DAYS
    );
  }
  function getUnknownActivityUsers(state) {
    return visibleUsers(
      state,
      (user) => activityStatus(state, user) === "unknown"
    ).sort((a, b) => a.handle.localeCompare(b.handle));
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
  function visibleUsers(state, predicate = () => true) {
    const filters = { ...DEFAULT_FILTERS, ...state.filters || {} };
    const hidden = setOf(state.hidden);
    const search = String(state.search || "").trim().toLowerCase().replace(/^@/, "");
    return (state.users || []).filter((user) => user && user.handle).filter(predicate).filter((user) => filters.showHidden || !isHidden(user, hidden)).filter((user) => filters.verified || !user.verified).filter((user) => filters.protected || !user.protected).filter((user) => filters.noAvatar || !isDefaultAvatar(user)).filter((user) => {
      if (!search) return true;
      return user.handle.toLowerCase().includes(search) || String(user.name || "").toLowerCase().includes(search);
    });
  }
  function getDisplayUsers(state, tab = state.activeTab || "nonFollowers") {
    const list = visibleUsers(state, (user) => {
      if (tab === "inactive") return activityStatus(state, user) === "inactive";
      return user.followsViewer !== true;
    });
    return list.sort((a, b) => {
      if (tab !== "inactive") return a.handle.localeCompare(b.handle);
      const aEntry = getActivityEntry(state, a);
      const bEntry = getActivityEntry(state, b);
      const aStamp = aEntry?.lastTweetAt === 0 ? -1 : Number(aEntry?.lastTweetAt) || 0;
      const bStamp = bEntry?.lastTweetAt === 0 ? -1 : Number(bEntry?.lastTweetAt) || 0;
      if (aStamp !== bStamp) return aStamp - bStamp;
      return a.handle.localeCompare(b.handle);
    });
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
    const visible = new Set(getDisplayUsers(state).map(keyOf));
    return (state.users || []).filter(
      (user) => user && user.handle && selected.has(keyOf(user)) && visible.has(keyOf(user))
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
  function transportLabel(run) {
    const transport = String(run?.transport || "mutation").toLowerCase();
    if (transport === "rest") return "REST";
    if (transport === "ui") return "UI";
    return "API";
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
  function renderRow(user, state, note = "") {
    const t = makeT(state.language);
    const key = keyOf(user);
    const selected = setOf(state.selected).has(key);
    const hidden = isHidden(user, setOf(state.hidden));
    return `<div class="ux-row${selected ? " is-selected" : ""}${hidden ? " is-hidden" : ""}" data-row="${escapeAttr(key)}">
    <input type="checkbox" data-select="${escapeAttr(key)}" ${selected ? "checked" : ""} aria-label="${escapeAttr(user.handle)}">
    <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener" aria-label="${escapeAttr(
      t("openOnX")
    )}">${avatarHTML(user)}</a>
    <div class="ux-user">
      <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener"><strong>${escapeHTML(
      user.name || user.handle
    )}</strong></a>
      <span>@${escapeHTML(user.handle)} ${badgesHTML(user, t)}${note ? ` <span class="ux-row-note">${escapeHTML(note)}</span>` : ""}</span>
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
  function activityNote(state, user, t) {
    const entry = getActivityEntry(state, user);
    if (!entry || entry.state !== "known") return "";
    if (entry.lastTweetAt === 0) return t("activityNever");
    return t("activityLastPost", {
      time: timeAgo(entry.lastTweetAt, state.language)
    });
  }
  function activityListSignature(state, users) {
    const selected = setOf(state.selected);
    const hidden = setOf(state.hidden);
    const rows = users.map((user) => {
      const key = keyOf(user);
      const entry = getActivityEntry(state, user);
      return [
        key,
        selected.has(key) ? 1 : 0,
        isHidden(user, hidden) ? 1 : 0,
        entry?.lastTweetAt ?? "",
        entry?.checkedAt ?? ""
      ].join(":");
    });
    return `${rows.join("|")}|${state.language}|${state.activityDays}`;
  }
  function activityUnknownSignature(state, users) {
    const rows = users.map((user) => {
      const entry = getActivityEntry(state, user);
      return [keyOf(user), entry?.reason ?? ""].join(":");
    });
    return `${rows.join("|")}|${state.language}`;
  }
  function reasonLabel(reason, t) {
    if (reason === "no-id") return t("activityReasonNoId");
    if (reason === "not-found") return t("activityReasonNotFound");
    if (reason === "template") return t("activityReasonTemplate");
    return t("activityReasonUnavailable");
  }
  function renderTabs(state, t) {
    const active = state.activeTab === "inactive" ? "inactive" : "nonFollowers";
    const nonFollowers = (state.users || []).filter(
      (user) => user && user.followsViewer !== true
    ).length;
    const inactive = (state.users || []).filter(
      (user) => activityStatus(state, user) === "inactive"
    ).length;
    return `<div class="ux-tabs" role="tablist" aria-label="${escapeAttr(
      t("auditKicker")
    )}">
    <button class="ux-tab${active === "nonFollowers" ? " is-active" : ""}" role="tab" aria-selected="${active === "nonFollowers"}" data-action="tab" data-tab="nonFollowers">
      <span>${escapeHTML(t("tabNonFollowers"))}</span><span class="ux-tab-count">${nonFollowers}</span>
    </button>
    <button class="ux-tab${active === "inactive" ? " is-active" : ""}" role="tab" aria-selected="${active === "inactive"}" data-action="tab" data-tab="inactive">
      <span>${escapeHTML(t("tabInactive"))}</span><span class="ux-tab-count">${inactive}</span>
    </button>
  </div>`;
  }
  function renderControls(state, t) {
    const filters = { ...DEFAULT_FILTERS, ...state.filters || {} };
    const hidden = setOf(state.hidden);
    return `<label class="ux-search">${ICONS.search}<input data-search value="${escapeAttr(
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
    </div>`;
  }
  function renderActionbar(state, t, { locked = false } = {}) {
    const users = getDisplayUsers(state);
    const selected = setOf(state.selected);
    const selectedList = users.filter((user) => selected.has(keyOf(user)));
    const selectedCount = selectedList.length;
    const unknownRelation = state.activeTab === "inactive" && selectedList.some((user) => typeof user.followsViewer !== "boolean");
    const allSelected = users.length > 0 && users.every((user) => selected.has(keyOf(user)));
    const someSelected = users.some((user) => selected.has(keyOf(user)));
    return `<div class="ux-actionbar" data-actionbar>
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
    <button class="ux-btn ux-btn-primary" data-action="unfollow" ${selectedCount === 0 || state.unverified || unknownRelation || locked ? "disabled" : ""} data-unfollow-label>${escapeHTML(t("unfollow"))}${selectedCount ? ` (${selectedCount})` : ""}</button>
  </div>`;
  }
  function renderUnknownRow(user, state, t) {
    const entry = getActivityEntry(state, user);
    const reason = reasonLabel(entry?.reason, t);
    return `<div class="ux-row ux-row-muted">
    <span class="ux-row-spacer" aria-hidden="true"></span>
    <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener" aria-label="${escapeAttr(
      t("openOnX")
    )}">${avatarHTML(user)}</a>
    <div class="ux-user">
      <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener"><strong>${escapeHTML(
      user.name || user.handle
    )}</strong></a>
      <span>@${escapeHTML(user.handle)} <span class="ux-badge ux-badge-muted">${escapeHTML(
      reason
    )}</span></span>
    </div>
    <div class="ux-row-actions">
      <button class="ux-icon-btn" data-copy="${escapeAttr(
      user.handle
    )}" title="${escapeAttr(t("copyHandle", { handle: user.handle }))}" aria-label="${escapeAttr(
      t("copyHandle", { handle: user.handle })
    )}">${ICONS.copy}</button>
      <a class="ux-icon-btn" href="${escapeAttr(
      profileUrl(user.handle)
    )}" target="_blank" rel="noreferrer noopener" title="${escapeAttr(
      t("openOnX")
    )}" aria-label="${escapeAttr(t("openOnX"))}">${ICONS.external}</a>
    </div>
  </div>`;
  }
  function renderUnknownSection(state, t) {
    const users = getUnknownActivityUsers(state);
    if (!users.length) return "";
    return `<details class="ux-unknown" data-activity-unknown-list>
    <summary>${escapeHTML(t("activityUnknownCount", { count: users.length }))}</summary>
    ${users.map((user) => renderUnknownRow(user, state, t)).join("")}
  </details>`;
  }
  function renderActivityEmpty(state, t) {
    if (state.activity?.status === "scanning" || state.activity?.status === "paused") {
      return `<div class="ux-empty"><strong>${escapeHTML(
        t("activityLiveEmpty")
      )}</strong></div>`;
    }
    const hasInactive = (state.users || []).some(
      (user) => activityStatus(state, user) === "inactive"
    );
    if (!hasInactive) {
      return `<div class="ux-empty"><strong>${escapeHTML(
        t("activityNone")
      )}</strong>${escapeHTML(t("activityStart"))}</div>`;
    }
    return `<div class="ux-empty"><strong>${escapeHTML(
      t("noMatches")
    )}</strong>${escapeHTML(t("selectHint"))}</div>`;
  }
  function renderActivityProgress(state, t) {
    const activity = state.activity || {};
    const checked = Number(activity.checked) || 0;
    const total = Number(activity.total) || 0;
    const inactive = Number(activity.inactive) || 0;
    const percent = total ? clamp(checked / total * 100, 0, 100) : 0;
    const paused = activity.status === "paused";
    return `<div class="ux-card ux-activity-progress">
    <div class="ux-card-line"><span class="ux-live-dot${paused ? " is-paused" : ""}" data-activity-dot></span><strong data-activity-status>${escapeHTML(
      paused ? t("paused") : t("activityScanning")
    )}</strong><span class="ux-muted" data-activity-source>${escapeHTML(
      activity.source === "graphql" || activity.source === "show" ? t("activitySourceProfile") : t("activitySourceBatch")
    )}</span></div>
    <div class="ux-bar"><i data-activity-bar style="width:${percent}%"></i></div>
    <div class="ux-card-line"><span data-activity-current>${escapeHTML(
      t("activityCurrent", { handle: activity.current || "?" })
    )}</span><span class="ux-muted" data-activity-progress>${escapeHTML(
      t("activityProgress", { checked, total })
    )}</span></div>
    <div class="ux-card-line"><span class="ux-muted" data-activity-found>${escapeHTML(
      t(inactive === 1 ? "activityFoundOne" : "activityFound", {
        count: inactive
      })
    )}</span><span class="ux-muted" data-activity-unknown-live>${escapeHTML(
      t("activityUnknownCount", { count: Number(activity.unknown) || 0 })
    )}</span></div>
    <div class="ux-card-actions">
      <button class="ux-btn ux-btn-soft" data-action="${paused ? "resume-activity" : "pause-activity"}" data-activity-toggle>${escapeHTML(
      paused ? t("resume") : t("pause")
    )}</button>
      <button class="ux-btn ux-btn-ghost" data-action="cancel-activity">${escapeHTML(
      t("cancel")
    )}</button>
    </div>
    <div class="ux-muted" data-activity-hint>${escapeHTML(
      countdownText(state) || t("activityHint")
    )}</div>
  </div>`;
  }
  function renderActivityView(state, t) {
    const users = getDisplayUsers(state, "inactive");
    const hasUsers = (state.users || []).some((user) => user && user.handle);
    const hasData = (state.users || []).some(
      (user) => user && user.handle && isActivityFresh(getActivityEntry(state, user))
    );
    const scanning = state.activity?.status === "scanning" || state.activity?.status === "paused";
    const partial = Boolean(state.activityScan && !state.activityScan.complete);
    const scanLabel = partial ? t("resume") : hasData ? t("rescan") : t("activityStart");
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
          t("partialBody", { count: state.scan?.scanned || (state.users || []).length })
        )}</span></div>`
      );
    }
    if (partial && !scanning) {
      warnings.push(
        `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          t("activityPartial", { count: Number(state.activityScan?.checked) || 0 })
        )}</span></div>`
      );
    }
    if (activityError(state)) {
      warnings.push(
        `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          activityError(state)
        )}</span></div>`
      );
    }
    const errorActions = state.activity?.status === "error" ? `<div class="ux-card-actions" data-activity-error-actions>
        <button class="ux-btn ux-btn-primary" data-action="start-activity">${escapeHTML(
      t("retry")
    )}</button>
        <button class="ux-btn ux-btn-ghost" data-action="tab" data-tab="nonFollowers">${escapeHTML(
      t("goBack")
    )}</button>
      </div>` : "";
    const headerActions = hasUsers ? `<div class="ux-results-links">
      ${scanning ? "" : `<button class="ux-link" data-action="start-activity">${escapeHTML(
      scanLabel
    )}</button>`}
      ${hasData && !scanning ? `<button class="ux-link" data-action="clear-activity">${escapeHTML(
      t("activityClear")
    )}</button>` : ""}
    </div>` : "";
    const header = `<div class="ux-results-head">
    <div>
      <span class="ux-eyebrow">${escapeHTML(t("activityKicker"))}</span>
      <div class="ux-hero-count">
        <strong data-activity-count>${users.length}</strong>
        <span data-activity-unit>${escapeHTML(
      users.length === 1 ? t("activityUnitOne") : t("activityUnit")
    )}</span>
      </div>
    </div>
    ${headerActions}
  </div>`;
    if (!hasUsers) {
      return `<div class="ux-results-body ux-activity" data-activity-view>
      ${header}
      ${warnings.join("")}
      <div class="ux-empty"><strong>${escapeHTML(
        t("activityNeedsScan")
      )}</strong>${escapeHTML(t("navigateHint"))}</div>
    </div>`;
    }
    if (!hasData && !scanning) {
      return `<div class="ux-results-body ux-activity" data-activity-view>
      ${header}
      ${warnings.join("")}
      ${errorActions}
      <div class="ux-activity-intro">
        <p>${escapeHTML(
        t("activityBody", {
          days: state.activityDays ?? ACTIVITY_DEFAULT_DAYS
        })
      )}</p>
        <button class="ux-btn ux-btn-primary ux-btn-block" data-action="start-activity">${escapeHTML(
        scanLabel
      )}</button>
      </div>
    </div>`;
    }
    const subline = `<div class="ux-subline">
    <span data-activity-progress>${escapeHTML(
      t("activityProgress", {
        checked: Number(state.activity?.checked) || 0,
        total: Number(state.activity?.total) || 0
      })
    )}</span>
    <span data-activity-unknown>${escapeHTML(
      t("activityUnknownCount", { count: getUnknownActivityUsers(state).length })
    )}</span>
    <span data-hidden-count>${escapeHTML(
      t("hiddenCount", { count: setOf(state.hidden).size })
    )}</span>
  </div>`;
    const lastChecked = Math.max(
      0,
      ...Object.values(state.activityEntries || {}).filter((entry) => isActivityFresh(entry)).map((entry) => Number(entry?.checkedAt) || 0)
    );
    const lastCheck = lastChecked ? `<div class="ux-muted">${escapeHTML(
      t("activityLastCheck", {
        time: timeAgo(lastChecked, state.language)
      })
    )}</div>` : "";
    return `<div class="ux-results-body ux-activity" data-activity-view>
    ${header}
    ${scanning ? renderActivityProgress(state, t) : subline}
    ${scanning ? "" : lastCheck}
    ${warnings.join("")}
    ${errorActions}
    ${scanning ? "" : renderControls(state, t)}
    <div class="ux-list" data-activity-list data-signature="${escapeAttr(
      activityListSignature(state, users)
    )}">${users.map((user) => renderRow(user, state, activityNote(state, user, t))).join("") || renderActivityEmpty(state, t)}</div>
    <div data-activity-unknown-host data-signature="${escapeAttr(
      activityUnknownSignature(state, getUnknownActivityUsers(state))
    )}">${renderUnknownSection(state, t)}</div>
    ${scanning ? "" : renderActionbar(state, t, { locked: false })}
  </div>`;
  }
  function activityError(state) {
    const activity = state.activity || {};
    if (!activity.error) return "";
    return activity.error;
  }
  function chip(label, key, on, extra = "") {
    return `<button class="ux-chip${on ? " is-on" : ""}" data-filter="${key}">${escapeHTML(
      label
    )}${extra}</button>`;
  }
  function renderNonFollowersView(state, t) {
    const users = getDisplayUsers(state, "nonFollowers");
    const hidden = setOf(state.hidden);
    const selectedCount = visibleSelectedCount(state);
    const activityRunning = state.active?.job === "activity" && state.active?.running;
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
    return `<div class="ux-results-body" data-nonfollowers-view>
    <div class="ux-results-head">
      <div>
        <span class="ux-eyebrow">${escapeHTML(t("auditKicker"))}</span>
        <div class="ux-hero-count">
          <strong data-result-count>${users.length}</strong>
          <span data-result-unit>${escapeHTML(
      users.length === 1 ? t("nonFollowersUnitOne") : t("nonFollowersUnit")
    )}</span>
        </div>
      </div>
      <div class="ux-results-links">
        ${state.partial && state.checkpoint ? `<button class="ux-link" data-action="resume" ${activityRunning ? "disabled" : ""}>${escapeHTML(t("resumeAfter"))}</button>` : ""}
        <button class="ux-link" data-action="rescan" ${activityRunning ? "disabled" : ""}>${escapeHTML(t("rescan"))}</button>
      </div>
    </div>
    <div class="ux-subline">
      <span data-selected-count>${escapeHTML(
      t("selectedCount", { count: selectedCount })
    )}</span>
      <span>${escapeHTML(
      t("scanNotice", {
        count: Number(state.scan?.scanned) || (state.users || []).length
      })
    )}</span>
      <span data-hidden-count>${escapeHTML(
      t("hiddenCount", { count: hidden.size })
    )}</span>
    </div>
    ${warnings.join("")}
    ${renderControls(state, t)}
    <div class="ux-list" data-list>${users.length ? users.map((user) => renderRow(user, state)).join("") : renderEmpty(state, t)}</div>
    ${renderActionbar(state, t, { locked: activityRunning })}
  </div>`;
  }
  function renderResultsView(state) {
    const t = makeT(state.language);
    return `<section class="ux-view ux-results" data-view="results">
    ${renderTabs(state, t)}
    ${state.activeTab === "inactive" ? renderActivityView(state, t) : renderNonFollowersView(state, t)}
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
        <strong>${handle ? `@${escapeHTML(handle)}` : escapeHTML(t("manualHandle"))}</strong>
        <span class="ux-muted">${escapeHTML(t("navigateHint"))}</span>
      </div>
      <button class="ux-btn ux-btn-primary ux-btn-block" data-action="scan">${ICONS.search}${escapeHTML(
      t("scanBtn")
    )}</button>
    </div>
    <div class="ux-stack">
      ${checkpoint ? `<button class="ux-btn ux-btn-soft" data-action="resume">${escapeHTML(
      t("resumeAfter")
    )}<span class="ux-muted">${checkpoint.users?.length || 0}</span></button>` : ""}
      ${lastScan ? `<button class="ux-btn ux-btn-ghost" data-action="show-last">${escapeHTML(
      t("showLastScan")
    )}<span class="ux-muted">${escapeHTML(
      timeAgo(lastScan.savedAt, state.language)
    )}</span></button>` : ""}
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
      <button class="ux-btn ux-btn-soft" data-action="cancel-scan">${escapeHTML(
      t("cancel")
    )}</button>
    </div>
  </section>`;
  }
  function renderUnfollowLog(run, t) {
    const log = (run.log || []).slice(-5).reverse();
    return log.length ? log.map(
      (entry) => `<div class="ux-log-row ${entry.ok ? "is-ok" : "is-fail"}"><span class="ux-dot"></span><span${entry.ok ? ' class="ux-strike"' : ""}>@${escapeHTML(entry.handle || "?")}</span><span class="ux-stamp">${escapeHTML(
        entry.ok ? t("unfollowedStamp") : entry.reason || t("failedStamp")
      )}</span></div>`
    ).join("") : `<div class="ux-empty">${escapeHTML(t("unfollowHint"))}</div>`;
  }
  function renderUnfollowView(state) {
    const t = makeT(state.language);
    const run = state.unfollow || {};
    const total = Number(run.total) || 0;
    const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
    const percent = total ? clamp(done / total * 100, 0, 100) : 0;
    const paused = Boolean(state.paused);
    return `<section class="ux-view ux-unfollowing" data-view="unfollowing">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow" data-unfollow-eyebrow>${escapeHTML(
      paused ? t("paused") : t("unfollowing")
    )}</span>
        <div class="ux-hero-count">
          <strong data-unfollow-count>${escapeHTML(
      String(done)
    )} / ${escapeHTML(String(total))}</strong>
          <span>${escapeHTML(t("processedUnit"))}</span>
        </div>
      </div>
      <span class="ux-source-badge" data-unfollow-transport>${escapeHTML(
      transportLabel(run)
    )}</span>
    </div>
    <div class="ux-bar"><i data-unfollow-progress style="width:${percent}%"></i></div>
    <div class="ux-current" data-unfollow-current>${escapeHTML(
      t("currently", { handle: run.current || "?" })
    )}</div>
    <div class="ux-next" data-next>${escapeHTML(countdownText(state))}</div>
    <div class="ux-statline">
      <div class="ux-stat"><strong data-unfollow-ok>${Number(run.ok) || 0}</strong><span>${escapeHTML(t("statOk"))}</span></div>
      <div class="ux-stat"><strong data-unfollow-fail>${Number(run.fail) || 0}</strong><span>${escapeHTML(t("statFail"))}</span></div>
      <div class="ux-stat"><strong data-unfollow-left>${Math.max(
      0,
      total - done
    )}</strong><span>${escapeHTML(t("statLeft"))}</span></div>
    </div>
    <div class="ux-log" data-unfollow-log>${renderUnfollowLog(run, t)}</div>
    <p class="ux-hint" data-unfollow-hint>${escapeHTML(
      paused ? t("unfollowPausedHint") : t("unfollowHint")
    )}</p>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-unfollow-toggle data-action="${paused ? "resume-unfollow" : "pause-unfollow"}">${escapeHTML(paused ? t("resume") : t("pause"))}</button>
      <button class="ux-btn ux-btn-soft" data-action="cancel-unfollow">${escapeHTML(
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
      <button class="ux-grip" data-drag-handle type="button" aria-label="${escapeAttr(
      t("movePanel")
    )}" title="${escapeAttr(
      t("movePanel")
    )}" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </button>
      <div class="ux-brand">
        <span class="ux-mark" aria-hidden="true">X</span>
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
        <button class="ux-icon-btn" data-action="close" title="${escapeAttr(
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
      return `${t("pillScanning")} ${Number(state.scan?.scanned) || (state.users || []).length}`;
    }
    if (state.mode === "unfollowing") {
      return `${t("pillUnfollowing")} ${Number(state.unfollow?.ok) || 0}/${Number(
        state.unfollow?.total
      ) || 0}`;
    }
    if (state.mode === "results" || state.mode === "done") {
      if (state.activity?.status === "scanning" || state.activity?.status === "paused") {
        return t("pillActivity");
      }
      if (state.activeTab === "inactive") {
        return t("pillInactive", { count: getDisplayUsers(state).length });
      }
      return t("pillResults", { count: getDisplayUsers(state).length });
    }
    return t("pillIdle");
  }
  function renderPill(state) {
    return `<button class="ux-pill" data-pill data-action="expand" title="${escapeAttr(
      makeT(state.language)("expand")
    )}">
    <span class="ux-pill-dot ${escapeAttr(state.mode || "idle")}"></span>
    <span data-pill-label>${escapeHTML(pillLabel(state))}</span>
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
    if (Number(state.activity?.nextAt) > now) {
      return t("nextActionIn", {
        seconds: Math.ceil((Number(state.activity.nextAt) - now) / 1e3)
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
  function settingsHTML(timings = {}, language = "en", activityDays = ACTIVITY_DEFAULT_DAYS) {
    const t = makeT(language);
    const merged = { ...DEFAULT_TIMINGS, ...timings };
    const seconds = (value) => (Number(value) / 1e3).toFixed(1);
    return `<div class="ux-settings" data-settings-body>
    <div class="ux-settings-group">
      <div class="ux-settings-title">${escapeHTML(t("settingsScan"))}</div>
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
      ${field(t("activityDays"), "activityDays", activityDays, {
      min: ACTIVITY_MIN_DAYS,
      max: ACTIVITY_MAX_DAYS
    })}
    </div>
    <div class="ux-settings-group">
      <div class="ux-settings-title">${escapeHTML(t("settingsUnfollow"))}</div>
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
  function readSettings(root, activityDaysFallback = ACTIVITY_DEFAULT_DAYS) {
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
    const activityElement = root?.querySelector?.(
      '[data-setting="activityDays"]'
    );
    const activityRaw = String(activityElement?.value ?? "").trim();
    const activityNumber = activityRaw === "" ? NaN : Number(activityRaw);
    const activityDays = Number.isFinite(activityNumber) && activityNumber > 0 ? activityNumber : activityDaysFallback;
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
      maxUnfollows: Math.round(clamp(read("maxUnfollows", 190), 1, 400)),
      activityDays: Math.round(
        clamp(activityDays, ACTIVITY_MIN_DAYS, ACTIVITY_MAX_DAYS)
      )
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
  function clampPanelPosition(left, top, width, height, viewportWidth = 1024, viewportHeight = 768, margin = PANEL.margin) {
    const maxLeft = Math.max(margin, viewportWidth - width - margin);
    const maxTop = Math.max(margin, viewportHeight - height - margin);
    return {
      left: clamp(left, margin, maxLeft),
      top: clamp(top, margin, maxTop)
    };
  }
  function resetPanelPosition(panel) {
    if (!panel) return;
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
  }
  function applyPanelPosition(panel, position) {
    if (!panel) return;
    const view = panel.ownerDocument?.defaultView || globalThis.window || globalThis;
    if (position && Number.isFinite(Number(position.left)) && Number.isFinite(Number(position.top))) {
      const next = clampPanelPosition(
        Number(position.left),
        Number(position.top),
        panel.offsetWidth || 0,
        panel.offsetHeight || 0,
        view.innerWidth || 1024,
        view.innerHeight || 768,
        PANEL.margin
      );
      panel.style.left = `${next.left}px`;
      panel.style.top = `${next.top}px`;
      panel.style.right = "auto";
    } else {
      resetPanelPosition(panel);
    }
  }
  function bindDrag(handle, panel, onEnd) {
    if (!handle || !panel || typeof handle.addEventListener !== "function") {
      return () => {
      };
    }
    const view = panel.ownerDocument?.defaultView || globalThis.window || globalThis;
    const keyTarget = handle.querySelector?.("[data-drag-handle]") || handle;
    handle.style.touchAction = "none";
    let active = null;
    let last = null;
    const moveTo = (left, top) => {
      const next = clampPanelPosition(
        left,
        top,
        panel.offsetWidth || 0,
        panel.offsetHeight || 0,
        view.innerWidth || 1024,
        view.innerHeight || 768,
        PANEL.margin
      );
      panel.style.left = `${next.left}px`;
      panel.style.top = `${next.top}px`;
      panel.style.right = "auto";
      last = next;
      return next;
    };
    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const interactive = event.target.closest?.(
        "button, a, input, select, textarea"
      );
      if (interactive && !interactive.hasAttribute?.("data-drag-handle")) {
        return;
      }
      const rect = panel.getBoundingClientRect();
      active = {
        id: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      last = { left: rect.left, top: rect.top };
      panel.style.right = "auto";
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      try {
        handle.setPointerCapture?.(event.pointerId);
      } catch {
      }
      handle.addEventListener("pointermove", onPointerMove);
      handle.addEventListener("pointerup", onPointerUp);
      handle.addEventListener("pointercancel", onPointerUp);
      event.preventDefault();
    };
    const onPointerMove = (event) => {
      if (!active || event.pointerId !== active.id) return;
      moveTo(event.clientX - active.offsetX, event.clientY - active.offsetY);
    };
    const onPointerUp = (event) => {
      if (!active || event.pointerId !== active.id) return;
      const id = active.id;
      active = null;
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      try {
        handle.releasePointerCapture?.(id);
      } catch {
      }
      onEnd?.(
        last || {
          left: Number.parseFloat(panel.style.left) || 0,
          top: Number.parseFloat(panel.style.top) || 0
        }
      );
    };
    const onKeyDown = (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key
      )) {
        return;
      }
      event.preventDefault();
      if (event.key === "Home") {
        resetPanelPosition(panel);
        last = null;
        onEnd?.(null);
        return;
      }
      const rect = panel.getBoundingClientRect();
      const step = event.shiftKey ? 32 : 8;
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      onEnd?.(moveTo(rect.left + dx, rect.top + dy));
    };
    const onDoubleClick = (event) => {
      if (event.target.closest?.("button, a, input, select, textarea")) {
        return;
      }
      resetPanelPosition(panel);
      last = null;
      onEnd?.(null);
    };
    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("dblclick", onDoubleClick);
    keyTarget.addEventListener("keydown", onKeyDown);
    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("dblclick", onDoubleClick);
      keyTarget.removeEventListener("keydown", onKeyDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
    };
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
    const view = document.defaultView || globalThis.window;
    const t = () => makeT(state.language);
    const updateActivity = () => {
      const users = getDisplayUsers(state);
      const list = root.querySelector("[data-activity-list]");
      if (list) {
        const signature = activityListSignature(state, users);
        if (list.getAttribute("data-signature") !== signature) {
          list.innerHTML = users.length ? users.map(
            (user) => renderRow(user, state, activityNote(state, user, t()))
          ).join("") : renderActivityEmpty(state, t());
          list.setAttribute("data-signature", signature);
        }
      }
      const unknownHost = root.querySelector("[data-activity-unknown-host]");
      if (unknownHost) {
        const unknown = getUnknownActivityUsers(state);
        const signature = activityUnknownSignature(state, unknown);
        if (unknownHost.getAttribute("data-signature") !== signature) {
          unknownHost.innerHTML = renderUnknownSection(state, t());
          unknownHost.setAttribute("data-signature", signature);
        }
      }
      const count = root.querySelector("[data-activity-count]");
      if (count) count.textContent = String(users.length);
      const inactiveTab = root.querySelector(
        '[data-tab="inactive"] .ux-tab-count'
      );
      if (inactiveTab) {
        inactiveTab.textContent = String(
          (state.users || []).filter(
            (user) => activityStatus(state, user) === "inactive"
          ).length
        );
      }
      const unit = root.querySelector("[data-activity-unit]");
      if (unit) {
        unit.textContent = users.length === 1 ? t()("activityUnitOne") : t()("activityUnit");
      }
      const progress = root.querySelector("[data-activity-progress]");
      if (progress) {
        progress.textContent = t()("activityProgress", {
          checked: Number(state.activity?.checked) || 0,
          total: Number(state.activity?.total) || 0
        });
      }
      const bar = root.querySelector("[data-activity-bar]");
      if (bar) {
        const total = Number(state.activity?.total) || 0;
        const checked = Number(state.activity?.checked) || 0;
        bar.style.width = `${total ? clamp(checked / total * 100, 0, 100) : 0}%`;
      }
      const current = root.querySelector("[data-activity-current]");
      if (current) {
        current.textContent = t()("activityCurrent", {
          handle: state.activity?.current || "?"
        });
      }
      const inactive = Number(state.activity?.inactive) || 0;
      const found = root.querySelector("[data-activity-found]");
      if (found) {
        found.textContent = t()(
          inactive === 1 ? "activityFoundOne" : "activityFound",
          { count: inactive }
        );
      }
      const unknownLive = root.querySelector("[data-activity-unknown-live]");
      if (unknownLive) {
        unknownLive.textContent = t()("activityUnknownCount", {
          count: Number(state.activity?.unknown) || 0
        });
      }
      const unknownSubline = root.querySelector("[data-activity-unknown]");
      if (unknownSubline) {
        unknownSubline.textContent = t()("activityUnknownCount", {
          count: getUnknownActivityUsers(state).length
        });
      }
      const hiddenCount = root.querySelector("[data-hidden-count]");
      if (hiddenCount) {
        hiddenCount.textContent = t()("hiddenCount", {
          count: setOf(state.hidden).size
        });
      }
      const source = root.querySelector("[data-activity-source]");
      if (source) {
        source.textContent = state.activity?.source === "graphql" || state.activity?.source === "show" ? t()("activitySourceProfile") : t()("activitySourceBatch");
      }
      const paused = state.activity?.status === "paused";
      const status = root.querySelector("[data-activity-status]");
      if (status) {
        status.textContent = paused ? t()("paused") : t()("activityScanning");
      }
      const dot = root.querySelector("[data-activity-dot]");
      if (dot) dot.classList.toggle("is-paused", paused);
      const hint = root.querySelector("[data-activity-hint]");
      if (hint) {
        hint.textContent = paused ? t()("activityHint") : countdownText(state) || t()("activityHint");
      }
      const toggle = root.querySelector("[data-activity-toggle]");
      if (toggle) {
        toggle.setAttribute(
          "data-action",
          paused ? "resume-activity" : "pause-activity"
        );
        toggle.textContent = paused ? t()("resume") : t()("pause");
      }
      const selectedCount = visibleSelectedCount(state);
      const selectedSet = setOf(state.selected);
      const selectedList = users.filter((user) => selectedSet.has(keyOf(user)));
      const unknownRelation = state.activeTab === "inactive" && selectedList.some((user) => typeof user.followsViewer !== "boolean");
      const unfollow = root.querySelector('[data-action="unfollow"]');
      if (unfollow) {
        unfollow.disabled = selectedCount === 0 || Boolean(state.unverified) || unknownRelation || state.activity?.status === "scanning" || state.activity?.status === "paused";
        unfollow.textContent = `${t()("unfollow")}${selectedCount ? ` (${selectedCount})` : ""}`;
      }
      const selectAll = root.querySelector("[data-select-all]");
      if (selectAll) {
        const selected = setOf(state.selected);
        const all = users.length > 0 && users.every((user) => selected.has(keyOf(user)));
        const some = users.some((user) => selected.has(keyOf(user)));
        selectAll.checked = all;
        selectAll.indeterminate = some && !all;
      }
      root.querySelectorAll("[data-filter]").forEach((button) => {
        const key = button.getAttribute("data-filter");
        button.classList.toggle("is-on", Boolean(state.filters?.[key]));
      });
    };
    const updateResults = () => {
      if ((state.activeTab || "nonFollowers") === "inactive") {
        updateActivity();
        return;
      }
      const users = getDisplayUsers(state);
      const list = root.querySelector("[data-list]");
      if (list) {
        list.innerHTML = users.length ? users.map((user) => renderRow(user, state)).join("") : renderEmpty(state, t());
      }
      const count = root.querySelector("[data-result-count]");
      if (count) count.textContent = String(users.length);
      const unit = root.querySelector("[data-result-unit]");
      if (unit) {
        unit.textContent = users.length === 1 ? t()("nonFollowersUnitOne") : t()("nonFollowersUnit");
      }
      const selectedCount = visibleSelectedCount(state);
      const selectedLabel = root.querySelector("[data-selected-count]");
      if (selectedLabel) {
        selectedLabel.textContent = t()("selectedCount", {
          count: selectedCount
        });
      }
      const hiddenCount = root.querySelector("[data-hidden-count]");
      if (hiddenCount) {
        hiddenCount.textContent = t()("hiddenCount", {
          count: setOf(state.hidden).size
        });
      }
      const unfollow = root.querySelector('[data-action="unfollow"]');
      if (unfollow) {
        const activityRunning = state.active?.job === "activity" && state.active?.running;
        unfollow.disabled = selectedCount === 0 || Boolean(state.unverified) || Boolean(activityRunning);
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
      const t2 = makeT(state.language);
      const run = state.unfollow || {};
      const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
      const total = Number(run.total) || 0;
      const paused = Boolean(state.paused);
      const bar = root.querySelector("[data-unfollow-progress]");
      if (bar) bar.style.width = `${total ? clamp(done / total * 100, 0, 100) : 0}%`;
      const eyebrow = root.querySelector("[data-unfollow-eyebrow]");
      if (eyebrow) {
        eyebrow.textContent = paused ? t2("paused") : t2("unfollowing");
      }
      const count = root.querySelector("[data-unfollow-count]");
      if (count) count.textContent = `${done} / ${total}`;
      const transport = root.querySelector("[data-unfollow-transport]");
      if (transport) {
        transport.textContent = transportLabel(run);
      }
      const current = root.querySelector("[data-unfollow-current]");
      if (current) {
        current.textContent = t2("currently", { handle: run.current || "?" });
      }
      const next = root.querySelector("[data-next]");
      if (next) next.textContent = countdownText(state);
      const ok = root.querySelector("[data-unfollow-ok]");
      if (ok) ok.textContent = String(Number(run.ok) || 0);
      const fail = root.querySelector("[data-unfollow-fail]");
      if (fail) fail.textContent = String(Number(run.fail) || 0);
      const left = root.querySelector("[data-unfollow-left]");
      if (left) left.textContent = String(Math.max(0, total - done));
      const log = root.querySelector("[data-unfollow-log]");
      if (log) {
        const nextLog = renderUnfollowLog(run, t2);
        if (log.innerHTML !== nextLog) log.innerHTML = nextLog;
      }
      const hint = root.querySelector("[data-unfollow-hint]");
      if (hint) {
        hint.textContent = paused ? t2("unfollowPausedHint") : t2("unfollowHint");
      }
      const toggle = root.querySelector("[data-unfollow-toggle]");
      if (toggle) {
        toggle.setAttribute(
          "data-action",
          paused ? "resume-unfollow" : "pause-unfollow"
        );
        toggle.textContent = paused ? t2("resume") : t2("pause");
      }
    };
    const update = () => {
      if (!root.isConnected) return;
      if (state.minimized) {
        const dot = root.querySelector(".ux-pill-dot");
        const label = root.querySelector("[data-pill-label]");
        if (!dot || !label) {
          root.innerHTML = renderPill(state);
          return;
        }
        dot.className = `ux-pill-dot ${state.mode || "idle"}`;
        label.textContent = pillLabel(state);
        return;
      }
      const view2 = root.querySelector("[data-view]");
      if (!view2 || view2.getAttribute("data-view") !== state.mode) {
        render();
        return;
      }
      if (state.mode === "results") updateResults();
      else if (state.mode === "scanning") updateScanning();
      else if (state.mode === "unfollowing") updateUnfollowing();
    };
    const render = () => {
      root.innerHTML = state.minimized ? renderPill(state) : renderShell(state);
      if (state.minimized) {
        const pill = root.querySelector("[data-pill]");
        applyPanelPosition(pill, state.panelPos);
        return;
      }
      const panel = root.querySelector("[data-panel]");
      const drag = root.querySelector("[data-drag]");
      applyPanelPosition(panel, state.panelPos);
      bindDrag(drag, panel, (position) => {
        state.panelPos = position;
        onChange();
      });
    };
    const onResize = () => {
      const target = root.querySelector(
        state.minimized ? "[data-pill]" : "[data-panel]"
      );
      if (target) applyPanelPosition(target, state.panelPos);
    };
    view?.addEventListener?.("resize", onResize);
    const openSettings = () => {
      const dialog = showDialog({
        title: t()("settingsTitle"),
        body: t()("settingsBody"),
        contentHTML: settingsHTML(
          state.timings,
          state.language,
          state.activityDays ?? ACTIVITY_DEFAULT_DAYS
        ),
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
          const timings = readSettings(
            overlay,
            state.activityDays ?? ACTIVITY_DEFAULT_DAYS
          );
          state.timings = timings;
          state.activityDays = timings.activityDays;
          onAction("save-settings", timings);
          setTimeout(() => {
            if (root.isConnected) render();
          }, 0);
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
      if (state.activeTab === "inactive" && selected.some((user) => typeof user.followsViewer !== "boolean")) {
        toast(t()("unverified"));
        return;
      }
      const count = selected.length;
      const activityTab = state.activeTab === "inactive";
      const followers = selected.filter(
        (user) => user.followsViewer === true
      ).length;
      showDialog({
        title: activityTab ? t()("activityUnfollowTitle", { count }) : t()("unfollowConfirmTitle", { count }),
        body: activityTab ? t()("activityUnfollowBody") : t()("unfollowConfirmBody"),
        contentHTML: activityTab && followers ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
          t()("activityFollowsWarning", { count: followers })
        )}</span></div>` : "",
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
          "open-following",
          "tab",
          "start-activity",
          "pause-activity",
          "resume-activity",
          "cancel-activity",
          "clear-activity"
        ]);
        if (actions.has(action)) {
          event.preventDefault();
          if (action === "settings") openSettings();
          else if (action === "manual-handle") openManualHandle();
          else if (action === "tab") {
            const tab = actionElement.getAttribute("data-tab");
            if (tab === "inactive" || tab === "nonFollowers") {
              if ((state.activeTab || "nonFollowers") === tab) return;
              state.activeTab = tab;
              state.selected = /* @__PURE__ */ new Set();
              onChange();
              render();
            }
            return;
          } else if (action === "clear-activity") {
            showDialog({
              title: t()("activityClearTitle"),
              body: t()("activityClearBody"),
              confirmLabel: t()("activityClear"),
              cancelLabel: t()("cancel"),
              destructive: true,
              onConfirm: () => onAction("clear-activity")
            });
            return;
          } else if (action === "start-activity" || action === "pause-activity" || action === "resume-activity" || action === "cancel-activity") {
            onAction(action);
            return;
          } else if (action === "select-none") {
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
        view?.removeEventListener?.("resize", onResize);
        root.querySelectorAll(".ux-toast").forEach((node) => node.remove());
        root.remove();
        document.getElementById(STYLE_ID)?.remove();
      }
    };
  }

  // src/theme.js
  var THEME_ATTR = "data-theme";
  var HIGH_CONTRAST_ATTR = "data-high-contrast";
  var REDUCE_MOTION_ATTR = "data-reduce-motion";
  function parseTheme(value) {
    return value === "light" || value === "dark" ? value : null;
  }
  function parseLuminance(value) {
    const match = String(value || "").match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) {
      return null;
    }
    const [r, g, b] = parts.slice(0, 3).map((channel) => {
      const v = channel / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function mediaMatches(win, query) {
    try {
      return Boolean(win?.matchMedia?.(query)?.matches);
    } catch {
      return false;
    }
  }
  function detectTheme(doc = globalThis.document, win = doc?.defaultView) {
    const declared = parseTheme(doc?.documentElement?.getAttribute(THEME_ATTR));
    if (declared) return declared;
    if (mediaMatches(win, "(prefers-color-scheme: dark)")) return "dark";
    if (mediaMatches(win, "(prefers-color-scheme: light)")) return "light";
    const background = win?.getComputedStyle?.(
      doc?.body || doc?.documentElement
    )?.backgroundColor;
    const luminance = parseLuminance(background);
    if (luminance !== null) return luminance < 0.5 ? "dark" : "light";
    return "dark";
  }
  function readXAppearance(doc = globalThis.document, win = doc?.defaultView) {
    const html = doc?.documentElement;
    return {
      theme: detectTheme(doc, win),
      highContrast: html?.getAttribute(HIGH_CONTRAST_ATTR) === "true",
      reduceMotion: html?.getAttribute(REDUCE_MOTION_ATTR) === "true" || mediaMatches(win, "(prefers-reduced-motion: reduce)")
    };
  }
  function applyXAppearance(root, appearance) {
    if (!root?.dataset) return;
    root.dataset.theme = appearance?.theme === "light" ? "light" : "dark";
    root.dataset.highContrast = appearance?.highContrast ? "true" : "false";
    root.dataset.reduceMotion = appearance?.reduceMotion ? "true" : "false";
  }
  function observeXAppearance(root, { document: doc = globalThis.document, window: win = doc?.defaultView } = {}) {
    const sync = () => applyXAppearance(root, readXAppearance(doc, win));
    sync();
    const Observer = doc?.defaultView?.MutationObserver;
    const observer = typeof Observer === "function" ? new Observer(sync) : null;
    observer?.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: [THEME_ATTR, HIGH_CONTRAST_ATTR, REDUCE_MOTION_ATTR]
    });
    const queries = [
      "(prefers-color-scheme: dark)",
      "(prefers-color-scheme: light)",
      "(prefers-reduced-motion: reduce)"
    ];
    const media = queries.map((query) => {
      try {
        return { mql: win?.matchMedia?.(query) };
      } catch {
        return { mql: null };
      }
    }).filter((item) => item.mql);
    const onChange = () => sync();
    for (const { mql } of media) {
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
      } else if (typeof mql.addListener === "function") {
        mql.addListener(onChange);
      }
    }
    return {
      sync,
      stop() {
        observer?.disconnect();
        for (const { mql } of media) {
          if (typeof mql.removeEventListener === "function") {
            mql.removeEventListener("change", onChange);
          } else if (typeof mql.removeListener === "function") {
            mql.removeListener(onChange);
          }
        }
      }
    };
  }

  // src/runtime.js
  var HOME_PATH = "/i/jf/";
  var ON_DEMAND_HOST = "https://abs.twimg.com";
  var CACHE_TTL = 20 * 60 * 1e3;
  var FAILURE_TTL = 60 * 1e3;
  var DEFAULT_KEYWORD = "obfiowerehiring";
  var ADDITIONAL_RANDOM_NUMBER = 3;
  var HASH_EPOCH = 16829244e5;
  function absolute(url, origin) {
    try {
      return new URL(url, origin).toString();
    } catch {
      return "";
    }
  }
  function firstMatch(value, pattern) {
    const match = String(value || "").match(pattern);
    return match ? match[1] : "";
  }
  function parseHomeShell(html) {
    if (typeof html !== "string" || !html) return null;
    const key = firstMatch(
      html,
      /<meta[^>]*name=["']twitter-site-verification["'][^>]*content=["']([^"']+)["']/i
    );
    const frames = [
      ...html.matchAll(
        /<(?:svg|div)[^>]*id=["']loading-x-anim-\d+["'][\s\S]*?<\/(?:svg|div)>/gi
      )
    ].map((block) => {
      const paths = [
        ...block[0].matchAll(/<path[^>]*\bd=["']([^"']+)["']/gi)
      ].map((match) => match[1]);
      return paths.sort((a, b) => b.length - a.length)[0] || "";
    });
    const chunkId = firstMatch(html, /(\d{3,6})\s*:\s*["']ondemand\.s["']/);
    let ondemandUrl = "";
    if (chunkId) {
      const hash = firstMatch(
        html,
        new RegExp(`${chunkId}\\s*:\\s*["']([a-zA-Z0-9_-]{12,})["']`)
      );
      if (hash) ondemandUrl = `${ON_DEMAND_HOST}/responsive-web/client-web/ondemand.s.${hash}a.js`;
    }
    if (!key || frames.length < 4 || !ondemandUrl) return null;
    return { key, frames, ondemandUrl };
  }
  function parseOndemandIndices(source) {
    if (typeof source !== "string" || !source) return [];
    return [...source.matchAll(/\(\w\[(\d{1,2})\],\s*16\)/g)].map(
      (match) => parseInt(match[1], 10)
    );
  }
  function parseOperationDefinition(source, operationName) {
    if (typeof source !== "string" || !source || !operationName) return null;
    const marker = new RegExp(
      `operationName:"${operationName}"[^]{0,60}?operationType:"query"`
    );
    const match = marker.exec(source);
    if (!match) return null;
    const index = match.index;
    const before = source.slice(Math.max(0, index - 300), index);
    const ids = [...before.matchAll(/queryId:"([^"]+)"/g)];
    let queryId = ids.length ? ids[ids.length - 1][1] : "";
    if (!queryId) {
      queryId = firstMatch(source.slice(index, index + 400), /queryId:"([^"]+)"/);
    }
    if (!queryId) return null;
    const slice = source.slice(index, index + 2e4);
    const array = (name) => {
      const body = firstMatch(slice, new RegExp(`${name}:\\[([^\\]]*)\\]`));
      return [...body.matchAll(/"([^"]+)"/g)].map((item) => item[1]);
    };
    return {
      queryId,
      featureSwitches: array("featureSwitches"),
      fieldToggles: array("fieldToggles")
    };
  }
  function buildFeatureValues(names) {
    const values = {};
    for (const name of names || []) {
      values[name] = typeof ACTIVITY_FEATURES[name] === "boolean" ? ACTIVITY_FEATURES[name] : false;
    }
    return values;
  }
  function buildFieldToggles(names) {
    const values = {};
    for (const name of names || []) values[name] = false;
    return values;
  }
  function decodeBase64(value) {
    if (typeof atob === "function") {
      const binary = atob(value);
      return Array.from(binary, (char) => char.charCodeAt(0));
    }
    return Array.from(Buffer.from(value, "base64"));
  }
  function encodeBase64(bytes) {
    if (typeof btoa === "function") {
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }
    return Buffer.from(bytes).toString("base64");
  }
  function interpolateNumber(from, to, fraction) {
    return from * (1 - fraction) + to * fraction;
  }
  function floatToHex(value) {
    const result = [];
    let quotient = Math.trunc(value);
    let fraction = value - quotient;
    while (quotient > 0) {
      const next = Math.trunc(quotient / 16);
      const remainder = quotient - next * 16;
      result.unshift(remainder > 9 ? String.fromCharCode(remainder + 55) : String(remainder));
      quotient = next;
    }
    if (fraction === 0) return result.join("");
    result.push(".");
    let guard = 0;
    while (fraction > 0 && guard < 24) {
      guard += 1;
      fraction *= 16;
      const integer = Math.trunc(fraction);
      fraction -= integer;
      result.push(integer > 9 ? String.fromCharCode(integer + 55) : String(integer));
    }
    return result.join("");
  }
  function isOdd(value) {
    return value % 2 ? -1 : 0;
  }
  var Cubic = class _Cubic {
    constructor(curves) {
      this.curves = curves;
    }
    static calculate(a, b, m) {
      return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
    }
    getValue(time) {
      const curves = this.curves;
      let startGradient = 0;
      let endGradient = 0;
      let start = 0;
      let mid = 0;
      let end = 1;
      if (time <= 0) {
        if (curves[0] > 0) startGradient = curves[1] / curves[0];
        else if (curves[1] === 0 && curves[2] > 0) startGradient = curves[3] / curves[2];
        return startGradient * time;
      }
      if (time >= 1) {
        if (curves[2] < 1) endGradient = (curves[3] - 1) / (curves[2] - 1);
        else if (curves[2] === 1 && curves[0] < 1) endGradient = (curves[1] - 1) / (curves[0] - 1);
        return 1 + endGradient * (time - 1);
      }
      while (start < end) {
        mid = (start + end) / 2;
        const estimate = _Cubic.calculate(curves[0], curves[2], mid);
        if (Math.abs(time - estimate) < 1e-5) {
          return _Cubic.calculate(curves[1], curves[3], mid);
        }
        if (estimate < time) start = mid;
        else end = mid;
      }
      return _Cubic.calculate(curves[1], curves[3], mid);
    }
  };
  function solve(value, min, max, rounding) {
    const result = value * (max - min) / 255 + min;
    return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
  }
  function animationFrames(frames, keyBytes) {
    const path = frames[keyBytes[5] % 4];
    return path.slice(9).split("C").map(
      (piece) => piece.replace(/[^\d]+/g, " ").trim().split(/\s+/).filter(Boolean).map(Number)
    );
  }
  function computeAnimationKey({ key, frames, indices }) {
    if (!key || !Array.isArray(frames) || frames.length < 4 || !indices?.length) {
      throw new Error("incomplete transaction inputs");
    }
    const keyBytes = decodeBase64(key);
    const rowIndex = indices[0];
    const byteIndices = indices.slice(1);
    const rows = animationFrames(frames, keyBytes);
    const row = rows[keyBytes[rowIndex] % 16 % rows.length];
    if (!row) throw new Error("missing animation frame");
    let frameTime = byteIndices.reduce((total, index) => total * (keyBytes[index] % 16), 1);
    frameTime = Math.round(frameTime / 10) * 10;
    const target = frameTime / 4096;
    const fromColor = row.slice(0, 3).concat(1).map(Number);
    const toColor = row.slice(3, 6).concat(1).map(Number);
    const toRotation = solve(row[6], 60, 360, true);
    const curves = row.slice(7).map((value, index) => solve(value, isOdd(index), 1, false));
    const progress = new Cubic(curves).getValue(target);
    const color = fromColor.map(
      (value, index) => Math.max(0, Math.min(255, interpolateNumber(value, toColor[index], progress)))
    );
    const rotation = interpolateNumber(0, toRotation, progress);
    const radians = rotation * Math.PI / 180;
    const matrix = [Math.cos(radians), -Math.sin(radians), Math.sin(radians), Math.cos(radians)];
    const parts = color.slice(0, 3).map((value) => Math.round(value).toString(16));
    for (const value of matrix) {
      const hex = floatToHex(Math.round(Math.abs(value) * 100) / 100);
      parts.push(hex.startsWith(".") ? `0${hex}`.toLowerCase() : hex || "0");
    }
    parts.push("0", "0");
    return parts.join("").replace(/[.-]/g, "");
  }
  async function sha256(text) {
    if (!globalThis.crypto?.subtle) throw new Error("crypto.subtle unavailable");
    const data = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest));
  }
  async function generateTransactionId({
    key,
    animationKey,
    method = "GET",
    path = "/",
    time = Date.now(),
    random = Math.random
  }) {
    const keyBytes = decodeBase64(key);
    const seconds = Math.floor((Number(time) - HASH_EPOCH) / 1e3);
    const timeBytes = [
      seconds & 255,
      seconds >> 8 & 255,
      seconds >> 16 & 255,
      seconds >> 24 & 255
    ];
    const hash = await sha256(
      `${method}!${path}!${seconds}${DEFAULT_KEYWORD}${animationKey}`
    );
    const noise = Math.floor(random() * 256);
    const payload = [
      noise,
      ...keyBytes.map((byte) => byte ^ noise),
      ...timeBytes.map((byte) => byte ^ noise),
      ...hash.slice(0, 16).map((byte) => byte ^ noise),
      ADDITIONAL_RANDOM_NUMBER ^ noise
    ];
    return encodeBase64(payload).replace(/=+$/, "");
  }
  function findMainScriptUrl(html, origin) {
    const source = firstMatch(
      html,
      /<script[^>]+src=["']([^"']*responsive-web\/client-web\/main\.[^"']+\.js)["']/i
    );
    return source ? absolute(source, origin) : "";
  }
  function createRuntimeClient({
    fetchImpl = globalThis.fetch,
    origin = "",
    now = () => Date.now(),
    cacheTtl = CACHE_TTL
  } = {}) {
    const base = origin || (typeof location !== "undefined" ? location.origin : "https://x.com");
    let shell = null;
    let mainScript = null;
    let failedAt = 0;
    async function fetchText(url) {
      if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable");
      const init = { credentials: "same-origin" };
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        init.signal = AbortSignal.timeout(2e4);
      }
      const response = await fetchImpl(url, init);
      if (!response || !response.ok) {
        throw new Error(`HTTP ${response?.status ?? "?"} for ${url}`);
      }
      return await response.text();
    }
    async function loadShell(force = false) {
      if (!force && shell && now() - shell.at < cacheTtl) return shell;
      const html = await fetchText(absolute(HOME_PATH, base));
      const parsed = parseHomeShell(html);
      if (!parsed) throw new Error("unrecognized X page shell");
      shell = { at: now(), html, parsed, animationKey: "" };
      return shell;
    }
    async function animationKey() {
      const current = await loadShell();
      if (current.animationKey) return current;
      const source = await fetchText(current.parsed.ondemandUrl);
      const indices = parseOndemandIndices(source);
      if (!indices.length) throw new Error("transaction indices not found");
      current.animationKey = computeAnimationKey({
        key: current.parsed.key,
        frames: current.parsed.frames,
        indices
      });
      return current;
    }
    async function getOperation(operationName) {
      const current = await loadShell();
      if (!mainScript || now() - mainScript.at >= cacheTtl) {
        const url = findMainScriptUrl(current.html, base);
        if (!url) throw new Error("main script not found");
        mainScript = { at: now(), text: await fetchText(url) };
      }
      const definition = parseOperationDefinition(mainScript.text, operationName);
      if (!definition) throw new Error(`operation ${operationName} not found`);
      return {
        queryId: definition.queryId,
        features: buildFeatureValues(definition.featureSwitches),
        fieldToggles: buildFieldToggles(definition.fieldToggles)
      };
    }
    async function getTransactionId(method, path) {
      if (now() - failedAt < FAILURE_TTL) return "";
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const current = await animationKey();
          return await generateTransactionId({
            key: current.parsed.key,
            animationKey: current.animationKey,
            method,
            path,
            time: now()
          });
        } catch (error) {
          shell = null;
          failedAt = now();
          if (attempt === 1) return "";
        }
      }
      return "";
    }
    function reset() {
      shell = null;
      mainScript = null;
      failedAt = 0;
    }
    return { getOperation, getTransactionId, reset };
  }

  // src/main.js
  var ACTIVE = null;
  var RUNTIME = null;
  var RUNTIME_ORIGIN = "";
  function runtimeFor(origin) {
    if (!RUNTIME || RUNTIME_ORIGIN !== origin) {
      RUNTIME = createRuntimeClient({ origin });
      RUNTIME_ORIGIN = origin;
    }
    return RUNTIME;
  }
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
  function idleActivity() {
    return {
      status: "idle",
      checked: 0,
      total: 0,
      inactive: 0,
      unknown: 0,
      current: "",
      source: "lookup",
      error: "",
      nextAt: 0,
      startedAt: 0
    };
  }
  function currentUserKeys(state) {
    const ids = /* @__PURE__ */ new Set();
    const handles = /* @__PURE__ */ new Set();
    for (const user of state.users || []) {
      if (!user || !user.handle) continue;
      if (user.id) ids.add(String(user.id));
      handles.add(String(user.handle).toLowerCase());
    }
    return { ids, handles };
  }
  function matchesActivityUser(entry, key, keys) {
    const id = String(entry?.id || "");
    const handle = String(entry?.handle || "").toLowerCase();
    const rawKey = String(key || "").toLowerCase();
    return Boolean(
      id && keys.ids.has(id) || handle && keys.handles.has(handle) || rawKey && (keys.ids.has(rawKey) || keys.handles.has(rawKey))
    );
  }
  function activitySummary(state) {
    const keys = currentUserKeys(state);
    const hasUsers = keys.ids.size > 0 || keys.handles.size > 0;
    const entries = Object.entries(state.activityEntries || {}).filter(
      ([key, entry]) => !hasUsers || matchesActivityUser(entry, key, keys)
    ).map(([, entry]) => entry).filter((entry) => isActivityFresh(entry));
    return {
      checked: entries.length,
      total: entries.length,
      inactive: entries.filter(
        (entry) => classifyActivity(entry, state.activityDays) === "inactive"
      ).length,
      unknown: entries.filter((entry) => entry.state === "unknown").length
    };
  }
  function refreshActivityCounters(state) {
    const summary = activitySummary(state);
    state.activity.checked = summary.checked;
    state.activity.total = summary.total;
    state.activity.inactive = summary.inactive;
    state.activity.unknown = summary.unknown;
  }
  function restoreActivityTemplateError(state) {
    if (state.activityScan?.stopped !== "template") return;
    state.activity.status = "error";
    state.activity.error = makeT(state.language)("activityGraphqlHint");
  }
  function hydrateActivityCounters(state) {
    const summary = activitySummary(state);
    state.activity = {
      ...idleActivity(),
      status: summary.checked ? "done" : "idle",
      checked: summary.checked,
      total: summary.total,
      inactive: summary.inactive,
      unknown: summary.unknown
    };
    restoreActivityTemplateError(state);
  }
  function pruneActivityCache(state) {
    if (!state.viewer.handle) return;
    const keys = currentUserKeys(state);
    for (const [key, entry] of Object.entries(state.activityEntries || {})) {
      if (!matchesActivityUser(entry, key, keys)) {
        delete state.activityEntries[key];
      }
    }
    saveActivity(void 0, state.viewer.handle, state.activityEntries);
    hydrateActivityCounters(state);
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
    const activityDays = clamp(
      Number(stored.activityDays) || ACTIVITY_DEFAULT_DAYS,
      ACTIVITY_MIN_DAYS,
      ACTIVITY_MAX_DAYS
    );
    return {
      mode: "idle",
      language: stored.language === "tr" ? "tr" : "en",
      viewer: { handle: "", id: "" },
      users: [],
      activeTab: "nonFollowers",
      activityDays,
      activityEntries: {},
      activityScan: null,
      activity: idleActivity(),
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
        wake: null,
        job: null
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
      minimized: state.minimized,
      activityDays: state.activityDays
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
  function abortError2() {
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
    state.activityEntries = loadActivity(void 0, state.viewer.handle);
    state.activityScan = loadActivityScan(void 0, state.viewer.handle);
    hydrateActivityCounters(state);
    const ui = mountUI({
      state,
      onAction: (action, payload) => handleAction(action, payload),
      onChange: () => persist(state)
    });
    const appearance = observeXAppearance(ui.root);
    state.ui = ui;
    state.checkpoint = loadCheckpoint(void 0, state.viewer.handle);
    state.lastScan = loadLastScan(void 0, state.viewer.handle);
    installCapture();
    ui.render();
    const t = () => makeT(state.language);
    let pauseTimer = null;
    let activityUiTimer = null;
    let activityUiAt = 0;
    let activityCacheWarned = false;
    let lastActivityPersistAt = 0;
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
    const scheduleActivityUi = (force = false) => {
      if (state.disposed) return;
      if (force) {
        activityUiAt = Date.now();
        ui.update();
        return;
      }
      const wait = 500 - (Date.now() - activityUiAt);
      if (wait <= 0) {
        activityUiAt = Date.now();
        ui.update();
        return;
      }
      if (activityUiTimer) return;
      activityUiTimer = setTimeout(() => {
        activityUiTimer = null;
        activityUiAt = Date.now();
        if (!state.disposed) ui.update();
      }, wait);
    };
    const saveActivityCache = () => {
      if (!state.viewer.handle) return true;
      return saveActivity(
        void 0,
        state.viewer.handle,
        state.activityEntries
      );
    };
    const persistActivity = (force = false) => {
      const now = Date.now();
      if (!force && now - lastActivityPersistAt < 15e3) return;
      const ok = saveActivityCache();
      if (!ok && !activityCacheWarned) {
        activityCacheWarned = true;
        ui.toast(t()("activityCacheWarning"));
      }
      if (state.activityScan) {
        state.activityScan.checked = Number(state.activity.checked) || 0;
        state.activityScan.total = Number(state.activity.total) || 0;
        saveActivityScan(void 0, state.activityScan);
      }
      lastActivityPersistAt = now;
    };
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
      state.activityEntries = loadActivity(void 0, handle);
      state.activityScan = loadActivityScan(void 0, handle);
      hydrateActivityCounters(state);
      state.activeTab = "nonFollowers";
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
      const previousHandle = state.viewer.handle;
      const handle = state.viewer.handle || resolveHandle(state);
      if (!handle) {
        requestManualHandle();
        return null;
      }
      state.viewer.handle = handle;
      state.viewer.id = state.viewer.id || parseTwid(getCookie("twid"));
      if (String(previousHandle || "").toLowerCase() !== String(handle).toLowerCase()) {
        state.users = [];
        state.selected = /* @__PURE__ */ new Set();
        state.checkpoint = loadCheckpoint(void 0, handle);
        state.lastScan = loadLastScan(void 0, handle);
        state.activityEntries = loadActivity(void 0, handle);
        state.activityScan = loadActivityScan(void 0, handle);
        hydrateActivityCounters(state);
      }
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
      refreshActivityCounters(state);
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
      state.active.job = null;
      if (truncated) {
        checkpointNow(result.stopReason);
      } else {
        state.checkpoint = null;
        clearCheckpoint(void 0);
      }
      state.error = state.source === "dom" && state.users.length === 0 ? t()("domEmpty") : "";
      snapshotLastScan();
      const complete = !truncated && state.source === "api" && state.users.length > 0 && ["done", "cursor", "total"].includes(result.stopReason);
      if (complete) pruneActivityCache(state);
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
      state.active.job = null;
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
      state.activeTab = "nonFollowers";
      state.activityScan = null;
      clearActivityScan(void 0);
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
        wake: null,
        job: "scan"
      };
      ui.render();
      const onFollowing = await ensureFollowingPage(handle);
      if (state.active.cancelled) {
        handleScanError(abortError2());
        return;
      }
      if (!onFollowing) {
        state.active.running = false;
        state.active.job = null;
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
        handleScanError(abortError2());
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
        handleScanError(lastError || abortError2());
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
      state.activityEntries = loadActivity(void 0, state.viewer.handle);
      state.activityScan = loadActivityScan(void 0, state.viewer.handle);
      state.activeTab = "nonFollowers";
      state.users = dedupeUsers(scan.users || []);
      hydrateActivityCounters(state);
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
    async function startActivityScan() {
      if (state.active.running || state.disposed) return;
      if (!(state.users || []).some((user) => user && user.handle)) {
        ui.toast(t()("activityNeedsScan"));
        return;
      }
      if (Date.now() < Number(state.cooldownUntil)) {
        ui.toast(
          t()("cooldownIn", { time: formatClock(state.cooldownUntil) })
        );
        return;
      }
      const session = ensureSession();
      if (!session) return;
      const candidates = state.users.filter((user) => {
        if (!user || !user.handle) return false;
        const entry = activityEntryFor(state.activityEntries, user);
        if (entry?.reason === "template" || entry?.state === "unknown") return true;
        return !isActivityFresh(entry);
      });
      if (!candidates.length) {
        state.activeTab = "inactive";
        state.mode = "results";
        state.activityScan = null;
        clearActivityScan(void 0);
        pruneSelection(state);
        hydrateActivityCounters(state);
        ui.render();
        ui.toast(t()("activityFresh"));
        return;
      }
      state.activeTab = "inactive";
      pruneSelection(state);
      state.mode = "results";
      state.error = "";
      state.paused = false;
      state.cooldownUntil = 0;
      state.scanPauseUntil = 0;
      state.activity = {
        ...idleActivity(),
        status: "scanning",
        total: candidates.length,
        source: "lookup",
        startedAt: Date.now()
      };
      state.activityScan = {
        viewerHandle: state.viewer.handle,
        startedAt: Date.now(),
        checked: 0,
        total: candidates.length,
        complete: false,
        stopped: null
      };
      saveActivityScan(void 0, state.activityScan);
      state.active = {
        running: true,
        paused: false,
        cancelled: false,
        abort: new AbortController(),
        wake: null,
        job: "activity"
      };
      activityCacheWarned = false;
      lastActivityPersistAt = 0;
      ui.render();
      const runtime = runtimeFor(session.origin);
      const templates = [];
      const captured = getCapturedActivity();
      if (captured) templates.push(captured);
      try {
        const operation = await runtime.getOperation("UserTweetsAndReplies");
        templates.push({
          url: `${session.origin}/i/api/graphql/${operation.queryId}/UserTweetsAndReplies`,
          method: "GET",
          headers: {},
          body: "",
          variables: {
            userId: "",
            count: 20,
            includePromotedContent: false,
            withCommunity: true,
            withVoice: true,
            withV2Timeline: true
          },
          features: operation.features,
          fieldToggles: operation.fieldToggles,
          queryId: operation.queryId,
          operationName: "UserTweetsAndReplies",
          capturedAt: 0,
          responseSample: null
        });
      } catch {
      }
      const onResult = (user, entry) => {
        if (state.disposed) return;
        const key = String(entry.id || user.handle.toLowerCase());
        const handleKey = String(user.handle || "").toLowerCase();
        if (entry.id && state.activityEntries[handleKey]) {
          delete state.activityEntries[handleKey];
        }
        state.activityEntries[key] = entry;
        if (!user.id && entry.id) user.id = entry.id;
        state.activity.checked = (Number(state.activity.checked) || 0) + 1;
        state.activity.current = user.handle;
        state.activity.source = entry.source || state.activity.source;
        if (entry.state === "unknown") {
          state.activity.unknown = (Number(state.activity.unknown) || 0) + 1;
        } else if (classifyActivity(entry, state.activityDays) === "inactive") {
          state.activity.inactive = (Number(state.activity.inactive) || 0) + 1;
        }
        scheduleActivityUi();
      };
      const onProgress = (event) => {
        if (state.disposed) return;
        if (event.kind === "delay") {
          state.activity.nextAt = Date.now() + Number(event.ms || 0);
          scheduleActivityUi();
          return;
        }
        if (event.kind === "pause") {
          state.scanPauseUntil = Date.now() + Number(event.ms || 0);
          scheduleActivityUi();
          return;
        }
        if (event.kind === "paused") {
          if (state.activity.status !== "paused") {
            state.activity.status = "paused";
            scheduleActivityUi(true);
          }
          return;
        }
        if (event.kind === "fallback") {
          state.activity.source = event.to === "show" ? "show" : "graphql";
          ui.toast(t()("activityFallback"));
          scheduleActivityUi(true);
          return;
        }
        if (event.kind === "template-broken") {
          ui.toast(t()("activityGraphqlHint"));
          return;
        }
        if (event.kind === "checkpoint") {
          persistActivity();
          scheduleActivityUi(true);
          return;
        }
        if (event.kind === "result") {
          state.activity.source = event.source || state.activity.source;
          scheduleActivityUi();
        }
      };
      try {
        const result = await runActivityScan({
          users: candidates,
          cache: state.activityEntries,
          days: state.activityDays,
          csrf: session.csrf,
          origin: session.origin,
          templates,
          transactionProvider: (method, path) => runtime.getTransactionId(method, path),
          fetchImpl: globalThis.fetch,
          sleepFn: (ms) => activeSleep(ms),
          random: Math.random,
          timings: state.timings,
          onResult,
          onProgress,
          shouldPause: () => state.active.paused,
          shouldCancel: () => state.active.cancelled,
          signal: state.active.abort.signal
        });
        if (state.disposed) return;
        const summary = activitySummary(state);
        const templateStopped = result.stopped === "template";
        state.activity.status = templateStopped ? "error" : "done";
        state.activity.nextAt = 0;
        state.scanPauseUntil = 0;
        state.activity.checked = summary.checked;
        state.activity.total = summary.total;
        state.activity.inactive = summary.inactive;
        state.activity.unknown = summary.unknown;
        state.activity.source = result.source || state.activity.source;
        if (templateStopped) {
          state.activity.error = t()("activityGraphqlHint");
          runtime.reset();
          if (state.activityScan) {
            state.activityScan.checked = state.activity.checked;
            state.activityScan.stopped = "template";
          }
        } else {
          state.activityScan = null;
          clearActivityScan(void 0);
        }
        persistActivity(true);
        state.active.running = false;
        state.active.paused = false;
        state.active.wake = null;
        state.active.job = null;
        state.paused = false;
        pruneSelection(state);
        ui.render();
        if (!templateStopped) {
          ui.toast(
            t()("activityDoneToast", { count: state.activity.inactive })
          );
        }
      } catch (error) {
        if (state.disposed) return;
        state.active.running = false;
        state.active.paused = false;
        state.active.wake = null;
        state.active.job = null;
        state.paused = false;
        state.activity.nextAt = 0;
        state.scanPauseUntil = 0;
        const aborted = state.active.cancelled || error?.kind === "aborted";
        if (aborted) {
          state.activity.status = "idle";
          state.activity.error = "";
          if (state.activityScan) state.activityScan.stopped = "cancel";
        } else {
          state.activity.status = "error";
          if (error?.kind === "rate") {
            state.cooldownUntil = Number(error.resetAt) || Date.now() + Number(error.retryAfter || COOLDOWN_MS.rate);
            state.activity.error = t()("tooManyRequests", {
              time: formatClock(state.cooldownUntil)
            });
          } else if (error?.kind === "auth") {
            state.activity.error = t()("sessionExpired");
          } else if (error?.kind === "blocked") {
            state.activity.error = t()("activityBlocked");
          } else if (error?.kind === "network") {
            state.activity.error = t()("networkError");
          } else {
            state.activity.error = t()("unknownError");
          }
          if (state.activityScan) {
            state.activityScan.stopped = error?.kind || "error";
          }
        }
        persistActivity(true);
        pruneSelection(state);
        ui.render();
      }
    }
    function clearActivityData() {
      if (state.active.running) return;
      state.activityEntries = {};
      state.activityScan = null;
      state.activity = idleActivity();
      state.selected = /* @__PURE__ */ new Set();
      clearActivity(void 0);
      clearActivityScan(void 0);
      ui.render();
      ui.toast(t()("activityCleared"));
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
      const visibleKeys = new Set(getDisplayUsers(state).map(keyOf));
      const selected = state.users.filter(
        (user) => user && user.handle && state.selected instanceof Set && state.selected.has(keyOf(user)) && visibleKeys.has(keyOf(user))
      );
      if (!selected.length) {
        ui.toast(t()("noSelection"));
        return;
      }
      if (state.activeTab === "inactive") {
        if (selected.some((user) => typeof user.followsViewer !== "boolean")) {
          ui.toast(t()("unverified"));
          return;
        }
      } else if (selected.some((user) => user.followsViewer !== false)) {
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
        wake: null,
        job: "unfollow"
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
            delete state.activityEntries[key];
            delete state.activityEntries[String(event.user.handle || "").toLowerCase()];
            refreshActivityCounters(state);
            saveActivityCache();
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
          ui.update();
        } else if (event.kind === "downgrade") {
          ui.toast(
            event.to === "ui" ? t()("uiFallback") : t()("transportDowngrade")
          );
          ui.update();
        } else if (event.kind === "long-pause") {
          ui.toast(
            t()("scanPause", {
              seconds: Math.round(Number(event.ms || 0) / 1e3)
            })
          );
          ui.update();
        } else if (event.kind === "paused") {
          if (!state.paused) {
            state.paused = true;
            ui.update();
          }
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
      state.active.job = null;
      state.paused = false;
      state.unfollow.ok = Number(output.ok) || 0;
      state.unfollow.fail = Number(output.fail) || 0;
      const overflow = Math.max(0, selected.length - targets.length);
      state.unfollow.remaining = (Number(output.remaining) || 0) + overflow;
      state.unfollow.transport = output.transport || state.unfollow.transport;
      state.unfollow.current = null;
      state.unfollow.nextAt = 0;
      if (output.stopped === "rate" || output.stopped === "blocked") {
        state.cooldownUntil = Number(output.stopInfo?.resetAt) || Date.now() + Number(
          output.stopInfo?.retryAfter || (output.stopped === "rate" ? COOLDOWN_MS.rate : COOLDOWN_MS.blocked)
        );
      }
      snapshotLastScan();
      state.mode = "done";
      ui.render();
      if (output.stopped === "rate" || output.stopped === "blocked") {
        ui.toast(
          output.stopped === "rate" ? t()("tooManyRequests", { time: formatClock(state.cooldownUntil) }) : t()("unfollowBlocked")
        );
      } else if (output.stopped === "auth") {
        ui.toast(t()("sessionExpired"));
      } else if (output.stopped === "network") {
        ui.toast(t()("networkError"));
      }
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
        const { activityDays, ...timingPayload } = payload || {};
        state.timings = normalizeTimings(
          Object.keys(timingPayload).length ? timingPayload : state.timings
        );
        state.activityDays = clamp(
          Number(activityDays) || state.activityDays,
          ACTIVITY_MIN_DAYS,
          ACTIVITY_MAX_DAYS
        );
        if (!state.active.running) refreshActivityCounters(state);
        pruneSelection(state);
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
      if (action === "start-activity") {
        startActivityScan();
        return;
      }
      if (action === "pause-activity") {
        if (state.active.job === "activity" && state.active.running) {
          state.active.paused = true;
          state.paused = true;
          state.activity.status = "paused";
          state.activity.nextAt = 0;
          state.active.wake?.();
          ui.update();
        }
        return;
      }
      if (action === "resume-activity") {
        if (state.active.job !== "activity") return;
        state.active.paused = false;
        state.paused = false;
        state.activity.status = "scanning";
        ui.update();
        return;
      }
      if (action === "cancel-activity") {
        if (state.active.job !== "activity") return;
        state.active.cancelled = true;
        state.active.paused = false;
        state.active.wake?.();
        state.active.abort?.abort();
        ui.toast(t()("cancel"));
        return;
      }
      if (action === "clear-activity") {
        clearActivityData();
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
          ui.update();
        }
        return;
      }
      if (action === "resume-unfollow") {
        state.active.paused = false;
        state.paused = false;
        ui.update();
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
        const wasPaused = state.paused || state.active.paused;
        state.active.paused = true;
        state.paused = true;
        if (state.active.job === "activity") {
          state.activity.status = "paused";
          state.activity.nextAt = 0;
          state.active.wake?.();
        }
        if (!wasPaused) ui.toast(t()("keepTabVisible"));
        if (state.mode === "unfollowing") ui.update();
        else ui.render();
      }
    }
    const cleanup = () => {
      if (state.disposed) return;
      if (state.active.job === "activity") persistActivity(true);
      state.disposed = true;
      state.active.cancelled = true;
      state.active.wake?.();
      state.active.abort?.abort();
      clearTimeout(pauseTimer);
      clearTimeout(activityUiTimer);
      activityUiTimer = null;
      document.removeEventListener("visibilitychange", onVisibility);
      uninstallCapture();
      appearance.stop();
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
