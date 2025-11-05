// Official Guardian chart palettes here

const categoricalLight = ['#0094DA','#C70000','#23B4A9','#A1A1A1','#CBA36E','#F678BB','#FF7F0F'];
const categoricalDark = ['#009CE3','#CE0E09','#35BBB1','#A1A1A1','#CBA36E','#F678BB','#FF8B25'];

// Old yacht charter chart palette

const defaultColors = [
    "#CC0A11",
    "#046DA1",
    "#f28e2c",
    "#76b7b2",
    "#59a14f",
    "#edc949",
    "#af7aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ab",
    "#000000"
  ]

// Australian political colours

export function getPartyColors(party) {
  switch (party) {
    case 'lnp':
      return '#005689';
    case 'coal':
      return '#005689';
    case 'nat':
      return '#197caa';
    case 'lib':
      return '#005689';
    case 'lp':
      return '#005689';
    case 'np':
      return '#197caa';
    case 'grn':
      return '#008800';
    case 'gvic':
      return '#008800';
    case 'alp':
      return '#d40000'; 
    case 'kap':
      return '#ff9b0b';
    case 'pup':
      return '#7D0069';
    case 'ca':
      return '#e6711b';
    case 'nxt':
      return '#e6711b';
    case 'xen':
      return '#e6711b';
    case 'ind':
      return '#982ea6';
    case 'on':
      return '#ec17ea';
    case 'uap':
      return '#d9d337';
    default:
      return '#000000';
  }
}

export { categoricalLight, categoricalDark, defaultColors };