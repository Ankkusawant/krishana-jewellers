
/* Theme engine — applies CSS variables from theme object.
   No hardcoded colours should appear in JS after this runs. */
(function(){
  const KEYS = {
    accentColor:           ['--gold'],
    secondaryColor:        ['--champagne'],
    backgroundColor:       ['--ivory'],
    surfaceColor:          ['--beige'],
    textColor:             ['--ink'],
    mutedColor:            ['--muted'],
    darkColor:             ['--charcoal','--announce-bg','--btn-bg'],
    primaryColor:          ['--charcoal'],
    buttonColor:           ['--btn-bg'],
    buttonTextColor:       ['--btn-text'],
    announcementColor:     ['--announce-bg'],
    announcementTextColor: ['--announce-text'],
    borderRadius:          ['--radius'],
    shadowStyle:           ['--shadow'],
    fontHeading:           ['--font-heading'],
    fontBody:              ['--font-body']
  };

  function apply(theme){
    if(!theme) return;
    const root = document.documentElement;
    Object.keys(KEYS).forEach(k => {
      const v = theme[k];
      if(v == null || v === '') return;
      KEYS[k].forEach(cssVar => {
        root.style.setProperty(cssVar, String(v));
      });
    });
    /* derive --line from text color */
    if(theme.textColor){
      root.style.setProperty('--line', hexToRgba(theme.textColor, 0.12) || 'rgba(24,22,20,.12)');
    }
    document.documentElement.dataset.theme = 'applied';
  }

  function hexToRgba(hex, a){
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
    if(!m) return null;
    let h = m[1];
    if(h.length === 3) h = h.split('').map(c=>c+c).join('');
    const n = parseInt(h, 16);
    const r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  window.Theme = { apply, hexToRgba };
})();
