
import appMap from "./appMap"

function getSize(width, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
      if (width < breakpoints[i].maxWidth) {
        return breakpoints[i].value;
      }
    }
    return breakpoints[breakpoints.length - 1].value;
  }
  
  const pixelBreakpoints = [
    { maxWidth: 401, value: 400 },
    { maxWidth: 481, value: 480 },
    { maxWidth: 641, value: 640 },
    { maxWidth: 961, value: 960 },
    { maxWidth: 1281, value: 1280 },
    { maxWidth: 1920, value: 1280 },
    { maxWidth: Infinity, value: 1920 }
  ];
  
  const iosBreakpoints = [
    { maxWidth: 231, value: 230 },
    { maxWidth: 271, value: 270 },
    { maxWidth: 361, value: 360 },
    { maxWidth: 541, value: 540 },
    { maxWidth: 721, value: 720 },
    { maxWidth: 1081, value: 1080 },
    { maxWidth: 1281, value: 1280 },
    { maxWidth: Infinity, value: 1920 }
  ];
  
  function pixelWidth(width) {
    return getSize(width, pixelBreakpoints);
  }

  function screenTest(width) {
    return (width < 540) ? true : false ;
  }
  
  function videoSize(width) {
    return getSize(width, pixelBreakpoints);
  }
  
  function iosSize(width) {
    return getSize(width, iosBreakpoints);
  }
  
    
function ios() {
    if (typeof navigator !== 'undefined') {
      const iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ];
  
      return !!navigator.platform && iDevices.includes(navigator.platform);
    }
    return false;
  }
   

function mobileCheck() {
    if (typeof navigator !== 'undefined') {
      const regex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      const a = navigator.userAgent || navigator.vendor || window.opera;
      return regex.test(a.substr(0, 4)) || /iPad/i.test(navigator.userAgent);
    }
    return false;
  }
  
  
function randomString(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
  
  
function localStorageAvailable() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('verify', 'confirm');
        if (localStorage.getItem('verify') === 'confirm') {
          localStorage.removeItem('verify');
          return true;
        }
      } catch(e) {
        return false;
      }
    }
    return false;
  }
  
  
export async function preflight(settings) {
    if (typeof navigator !== 'undefined') {
      settings.platform = navigator.platform.toLowerCase();
      settings.userAgent = navigator.userAgent.toLowerCase();
      settings.isMobile = mobileCheck();
  
      settings.app = {
        isApp: window.location.origin === "file://" || window.location.origin === null || window.location.origin === "https://mobile.guardianapis.com",
        isIos: ios(),
        isAndroid: /(android)/i.test(navigator.userAgent),
        isiPhone: /(iPhone)/i.test(navigator.platform),
        isiPad: /iPad/i.test(navigator.userAgent)
      };
    } else {
      console.warn('Navigator is not defined. Running in a non-browser environment.');
      settings.platform = 'unknown';
      settings.userAgent = 'unknown';
      settings.isMobile = false;
      settings.app = {
        isApp: false,
        isIos: false,
        isAndroid: false,
        isiPhone: false,
        isiPad: false
      };
    }
  
    settings.localstore = localStorageAvailable();
    settings.randomID = randomString(32);
    settings.screenWidth = document.documentElement.clientWidth;
    settings.screenHeight = document.documentElement.clientHeight;
    settings.portrait = settings.screenWidth < 740;
    settings.pixelWidth = pixelWidth(settings.screenWidth);
    settings.videoWidth = videoSize(settings.screenWidth);
    settings.iosWidth = iosSize(settings.screenWidth);
    settings.smallScreen = screenTest(settings.screenWidth);
  
    return settings;
  }
  
  

  

  
const isMobileApp = () => {
  const parentIsIos = document.querySelector(".ios")
  const parentIsAndroid = document.querySelector(".android")
  return parentIsIos || parentIsAndroid
}

const selectorAppOrDCR = (toSelect) =>
  isMobileApp() ? appMap[toSelect].app : appMap[toSelect].desktop


export { selectorAppOrDCR }