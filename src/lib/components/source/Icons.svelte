<script>
  import "@guardian/interactive-source-components/icons.css";

  let { icon = "add-to-basket", size = "medium" } = $props();

  /*
  Read more... https://guardian.github.io/storybooks/?path=/docs/source_react-components-icons--docs

  | Class | Description | Default |
  | --- | --- | --- |
  | `src-icon--add-to-basket` | Add to basket icon. | ✅ |
  | `src-icon--alarm-clock-filled` | Alarm clock filled icon. | |
  | `src-icon--alarm-clock-outlined` | Alarm clock outline icon. | |
  | `src-icon--alarm-clock-sounded` | Alarm clock ringing icon. | |
  | `src-icon--alert-phone` | Phone alert/notification icon. | |
  | `src-icon--alert-round` | Alert in a circle icon. | |
  | `src-icon--all-recipes` | All recipes category icon. | |
  | `src-icon--apple-brand` | Apple brand logo icon. | |
  | `src-icon--arrow-contract` | Contract arrows icon. | |
  | `src-icon--arrow-down-straight` | Down arrow (straight) icon. | |
  | `src-icon--arrow-expand` | Expand arrows icon. | |
  | `src-icon--arrow-left-straight` | Left arrow (straight) icon. | |
  | `src-icon--arrow-outdent` | Outdent arrow icon. | |
  | `src-icon--arrow-pop-out` | Pop-out/external arrow icon. | |
  | `src-icon--arrow-right-straight` | Right arrow (straight) icon. | |
  | `src-icon--arrow-scroll` | Scroll indicator arrows icon. | |
  | `src-icon--arrow-up-and-down-small` | Up and down arrows (small) icon. | |
  | `src-icon--arrow-up-straight` | Up arrow (straight) icon. | |
  | `src-icon--arrow-up-straight-small` | Up arrow (straight, small) icon. | |
  | `src-icon--asterisk` | Asterisk symbol icon. | |
  | `src-icon--audio` | Audio/volume icon. | |
  | `src-icon--audio-mute` | Muted speaker icon. | |
  | `src-icon--bin` | Bin/trash can icon. | |
  | `src-icon--book-outlined` | Book outline icon. | |
  | `src-icon--bookmark-cross` | Bookmark remove (cross) icon. | |
  | `src-icon--bookmark-filled` | Bookmark filled icon. | |
  | `src-icon--bookmark-outlined` | Bookmark outline icon. | |
  | `src-icon--bookmark-round-filled` | Bookmark in circle filled icon. | |
  | `src-icon--bookmark-round-outlined` | Bookmark in circle outline icon. | |
  | `src-icon--calendar` | Calendar/date icon. | |
  | `src-icon--camera` | Camera icon. | |
  | `src-icon--camera-round-outlined` | Camera in circle outline icon. | |
  | `src-icon--camera-small` | Camera small icon. | |
  | `src-icon--checkmark` | Checkmark/tick icon. | |
  | `src-icon--chef` | Chef’s hat icon. | |
  | `src-icon--chevron-down-double` | Chevron down double icon. | |
  | `src-icon--chevron-down-single` | Chevron down single icon. | |
  | `src-icon--chevron-down-single-small` | Chevron down single small icon. | |
  | `src-icon--chevron-down-single-xsmall` | Chevron down single xsmall icon. | |
  | `src-icon--chevron-left-double` | Chevron left double icon. | |
  | `src-icon--chevron-left-single` | Chevron left single icon. | |
  | `src-icon--chevron-left-single-small` | Chevron left single small icon. | |
  | `src-icon--chevron-right-double` | Chevron right double icon. | |
  | `src-icon--chevron-right-single` | Chevron right single icon. | |
  | `src-icon--chevron-right-single-small` | Chevron right single small icon. | |
  | `src-icon--chevron-up-and-down-small` | Chevron up and down small icon. | |
  | `src-icon--chevron-up-double` | Chevron up double icon. | |
  | `src-icon--chevron-up-single` | Chevron up single icon. | |
  | `src-icon--chevron-up-single-small` | Chevron up single small icon. | |
  | `src-icon--clock-baseline-small` | Small clock aligned to baseline icon. | |
  | `src-icon--clock-filled` | Clock filled icon. | |
  | `src-icon--clock-outlined` | Clock outline icon. | |
  | `src-icon--cloud-sync` | Cloud sync icon. | |
  | `src-icon--cloud-upload` | Cloud upload icon. | |
  | `src-icon--credit-card` | Credit card icon. | |
  | `src-icon--cross` | Cross/close icon. | |
  | `src-icon--cross-round-filled` | Cross in circle filled icon. | |
  | `src-icon--cross-round-outlined` | Cross in circle outline icon. | |
  | `src-icon--cross-small` | Cross small icon. | |
  | `src-icon--crossed-out-cloud` | Cloud crossed out/offline icon. | |
  | `src-icon--crosswords` | Crosswords grid icon. | |
  | `src-icon--cuisines` | Cuisines/food types icon. | |
  | `src-icon--diets` | Diets/food preferences icon. | |
  | `src-icon--direct-debit` | Direct debit/bank icon. | |
  | `src-icon--discover` | Discover brand icon. | |
  | `src-icon--document` | Document/page icon. | |
  | `src-icon--download` | Download arrow icon. | |
  | `src-icon--drag-handle` | Drag handle icon. | |
  | `src-icon--edit` | Edit/pencil icon. | |
  | `src-icon--ellipsis` | Ellipsis/more icon. | |
  | `src-icon--envelope` | Envelope/mail icon. | |
  | `src-icon--exclamation` | Exclamation/warning icon. | |
  | `src-icon--external` | External link icon. | |
  | `src-icon--eye` | Eye/show icon. | |
  | `src-icon--eye-strike` | Eye with strike-through/hidden icon. | |
  | `src-icon--facebook` | Facebook icon. | |
  | `src-icon--facebook-brand` | Facebook brand logo icon. | |
  | `src-icon--facebook-messenger` | Facebook Messenger icon. | |
  | `src-icon--filter` | Filter icon. | |
  | `src-icon--filter-android-app` | Filter (Android app) icon. | |
  | `src-icon--filter-android-app-small` | Filter (Android app, small) icon. | |
  | `src-icon--filter-ios-app` | Filter (iOS app) icon. | |
  | `src-icon--filter-ios-app-small` | Filter (iOS app, small) icon. | |
  | `src-icon--filter-outlined-web` | Filter outlined (web) icon. | |
  | `src-icon--folder` | Folder icon. | |
  | `src-icon--folder-filled` | Folder filled icon. | |
  | `src-icon--gift` | Gift/present icon. | |
  | `src-icon--globe` | Globe/world icon. | |
  | `src-icon--google-brand` | Google brand logo icon. | |
  | `src-icon--gps` | GPS/locator icon. | |
  | `src-icon--hand-pointed` | Pointing hand/cursor icon. | |
  | `src-icon--headphones-filled` | Headphones filled icon. | |
  | `src-icon--headphones-outlined` | Headphones outline icon. | |
  | `src-icon--headphones-round-filled` | Headphones in circle filled icon. | |
  | `src-icon--headphones-round-outlined` | Headphones in circle outline icon. | |
  | `src-icon--home-house-filled` | Home (house) filled icon. | |
  | `src-icon--home-house-outlined` | Home (house) outline icon. | |
  | `src-icon--home-square-filled` | Home (square) filled icon. | |
  | `src-icon--home-square-outlined` | Home (square) outline icon. | |
  | `src-icon--house-cross` | House with cross/remove icon. | |
  | `src-icon--house-plus` | House with plus/add icon. | |
  | `src-icon--house-setting` | House settings/gear icon. | |
  | `src-icon--indent` | Indent arrow icon. | |
  | `src-icon--info-round` | Info in a circle icon. | |
  | `src-icon--ingredient1` | Ingredient icon 1. | |
  | `src-icon--ingredient2` | Ingredient icon 2. | |
  | `src-icon--ingredient3` | Ingredient icon 3. | |
  | `src-icon--knife-and-fork` | Knife and fork icon. | |
  | `src-icon--linked-in` | LinkedIn brand icon. | |
  | `src-icon--list` | List/bulleted list icon. | |
  | `src-icon--location-marker` | Location marker/pin icon. | |
  | `src-icon--magnifying-glass` | Magnifying glass/search icon. | |
  | `src-icon--magnifying-glass-minus` | Zoom out icon. | |
  | `src-icon--magnifying-glass-plus` | Zoom in icon. | |
  | `src-icon--magnifying-glass-sad-face` | No results/sad search icon. | |
  | `src-icon--meal-types` | Meal types icon. | |
  | `src-icon--media-controls-back` | Media controls back/previous icon. | |
  | `src-icon--media-controls-forward` | Media controls forward/next icon. | |
  | `src-icon--media-controls-pause` | Media controls pause icon. | |
  | `src-icon--media-controls-play` | Media controls play icon. | |
  | `src-icon--media-controls-stop` | Media controls stop icon. | |
  | `src-icon--menu` | Menu/hamburger icon. | |
  | `src-icon--message` | Message/speech icon. | |
  | `src-icon--message-round` | Message bubble (round) icon. | |
  | `src-icon--minus` | Minus/remove icon. | |
  | `src-icon--moon` | Moon/night mode icon. | |
  | `src-icon--newsletter-filled` | Newsletter filled icon. | |
  | `src-icon--newsletter-outlined` | Newsletter outline icon. | |
  | `src-icon--newspaper-archive` | Newspaper archive icon. | |
  | `src-icon--note-filled` | Note filled icon. | |
  | `src-icon--note-outlined` | Note outline icon. | |
  | `src-icon--notifications-off` | Notifications off icon. | |
  | `src-icon--notifications-off-round` | Notifications off in circle icon. | |
  | `src-icon--notifications-on` | Notifications on icon. | |
  | `src-icon--notifications-on-round` | Notifications on in circle icon. | |
  | `src-icon--padlock` | Padlock icon. | |
  | `src-icon--padlock-locked` | Padlock locked icon. | |
  | `src-icon--padlock-unlocked` | Padlock unlocked icon. | |
  | `src-icon--party-of-three` | Party of three/people icon. | |
  | `src-icon--party-popper-filled` | Party popper filled icon. | |
  | `src-icon--party-popper-outlined` | Party popper outline icon. | |
  | `src-icon--pay-pal-brand` | PayPal brand logo icon. | |
  | `src-icon--person` | Person/user icon. | |
  | `src-icon--person-cross` | Person with cross/remove icon. | |
  | `src-icon--person-plus` | Person with plus/add icon. | |
  | `src-icon--person-round-filled` | Person in circle filled icon. | |
  | `src-icon--person-round-outlined` | Person in circle outline icon. | |
  | `src-icon--person-tick` | Person with tick/verified icon. | |
  | `src-icon--phone` | Phone/telephone icon. | |
  | `src-icon--pinned` | Pinned/pin icon. | |
  | `src-icon--pinterest` | Pinterest brand icon. | |
  | `src-icon--plus` | Plus/add icon. | |
  | `src-icon--plus-on-round` | Plus in circle icon. | |
  | `src-icon--quote` | Quote marks icon. | |
  | `src-icon--reload` | Reload/refresh icon. | |
  | `src-icon--settings` | Settings/gear icon. | |
  | `src-icon--share-app` | Share app icon. | |
  | `src-icon--share-app-small` | Share app small icon. | |
  | `src-icon--share-callout` | Share callout/arrow icon. | |
  | `src-icon--share-round-filled` | Share in circle filled icon. | |
  | `src-icon--share-round-outline` | Share in circle outline icon. | |
  | `src-icon--share-web` | Share to web/browser icon. | |
  | `src-icon--shopping-basket` | Shopping basket icon. | |
  | `src-icon--shopping-list` | Shopping list icon. | |
  | `src-icon--signal-brand` | Signal brand icon. | |
  | `src-icon--sort` | Sort icon. | |
  | `src-icon--speech-bubble` | Speech bubble/talk icon. | |
  | `src-icon--speech-bubble-cross` | Speech bubble with cross icon. | |
  | `src-icon--speech-bubble-plus` | Speech bubble with plus icon. | |
  | `src-icon--star` | Star/favourite icon. | |
  | `src-icon--star-outline` | Star outline icon. | |
  | `src-icon--telegram-brand` | Telegram brand icon. | |
  | `src-icon--text-large` | Text large icon. | |
  | `src-icon--text-size` | Text size icon. | |
  | `src-icon--text-size-round-filled` | Text size in circle filled icon. | |
  | `src-icon--text-size-round-outline` | Text size in circle outline icon. | |
  | `src-icon--text-small` | Text small icon. | |
  | `src-icon--tick-round` | Tick in circle icon. | |
  | `src-icon--timer` | Timer/stopwatch icon. | |
  | `src-icon--transparent-arrow-left-straight-round` | Transparent left arrow in circle icon. | |
  | `src-icon--twitter` | Twitter brand icon. | |
  | `src-icon--upload` | Upload arrow icon. | |
  | `src-icon--video` | Video icon. | |
  | `src-icon--whats-app` | WhatsApp icon. | |
  | `src-icon--whats-app-brand` | WhatsApp brand icon. | |
  */
</script>

<div class="src-icon--{icon} src-icon--{size}"></div>
